import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';
import { sendEmail } from '@/lib/email';
import { getBookingCancellationEmail } from '@/lib/email-templates';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Получаем бронирование и проверяем права доступа
    const booking = await prisma.booking.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Отменяем бронирование и возвращаем средства в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Обновляем статус бронирования
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'cancelled' },
      });

      // Создаем транзакцию возврата средств
      const refundTransaction = await tx.transaction.create({
        data: {
          amount: booking.totalAmount,
          currency: booking.currency,
          type: 'refund',
          status: 'completed',
          userId: booking.userId,
          description: `Refund for cancelled ${booking.type} booking`,
          bookingId: booking.id,
        },
      });

      // Обновляем баланс пользователя
      const updatedBalance = await tx.balance.update({
        where: { userId: booking.userId },
        data: {
          amount: {
            increment: booking.totalAmount,
          },
        },
      });

      return { booking: updatedBooking, transaction: refundTransaction, balance: updatedBalance };
    });

    // Оповещаем об изменении баланса
    eventBus.emit(BALANCE_UPDATED);

    // Отправляем email с подтверждением отмены
    const emailData = {
      userName: session.user.name || 'User',
      bookingId: booking.id,
      type: booking.type,
      details: booking.details,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
    };
    
    await sendEmail(
      session.user.email!,
      getBookingCancellationEmail(emailData)
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
