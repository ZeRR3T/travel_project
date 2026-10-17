import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';

export async function POST(req: Request) {
  try {
    // Получаем все заголовки для отладки
    const headers = new Headers(req.headers);
    console.log('Deduct API - Request headers:', Object.fromEntries(headers.entries()));
    console.log('Deduct API - Request cookies:', headers.get('cookie'));

    const session = await getServerSession(authOptions);

    console.log('Deduct API - Session data:', session);
    console.log('Deduct API - Session user:', session?.user);

    if (!session?.user) {
      console.log('Deduct API - No session user found, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { amount, currency = 'USD', type, providerRef, details } = await req.json();

    console.log('Deduct API - Request body:', { amount, currency, type, providerRef, details });

    if (!amount || amount <= 0) {
      console.log('Deduct API - Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Проверяем баланс и создаем бронирование в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Получаем текущий баланс
      const balance = await tx.balance.findUnique({
        where: { userId: session.user.id },
      });

      console.log('Deduct API - Current balance:', balance);

      if (!balance || balance.amount < amount) {
        console.log('Deduct API - Insufficient funds:', {
          currentBalance: balance?.amount || 0,
          requiredAmount: amount
        });
        throw new Error('Insufficient funds');
      }

      // Создаем бронирование
      const booking = await tx.booking.create({
        data: {
          userId: session.user.id,
          type,
          status: 'pending',
          providerRef,
          details,
          totalAmount: amount,
          currency,
        },
      });

      // Создаем транзакцию
      const transaction = await tx.transaction.create({
        data: {
          amount: -amount, // Отрицательная сумма для списания
          currency,
          type: 'booking',
          status: 'completed',
          userId: session.user.id,
          description: `Booking: ${type}`,
          bookingId: booking.id,
        },
      });

      // Обновляем баланс
      const updatedBalance = await tx.balance.update({
        where: { userId: session.user.id },
        data: {
          amount: {
            decrement: amount,
          },
        },
      });

      return { booking, transaction, balance: updatedBalance };
    });

    // Оповещаем об изменении баланса
    eventBus.emit(BALANCE_UPDATED);

    console.log('Deduct API - Success:', result);
    return NextResponse.json(
      { success: true, result },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error deducting balance:', error);
    if (error instanceof Error && error.message === 'Insufficient funds') {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}