import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - оформить заказ из корзины
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyMobileToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(' Processing checkout for user:', user.userId);

    // Получаем элементы корзины пользователя
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      orderBy: { addedAt: 'asc' },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Вычисляем общую стоимость
    const totalAmount = cartItems.reduce((total, item) => total + item.price, 0);

    // Получаем баланс пользователя
    const userBalance = await prisma.balance.findUnique({
      where: { userId: user.userId }
    });

    const currentBalance = userBalance?.amount || 0;

    if (currentBalance < totalAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        required: totalAmount,
        available: currentBalance
      }, { status: 400 });
    }

    console.log(' Starting checkout transaction...');

    // Выполняем все операции в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      const bookings = [];
      const transactions = [];

      // Создаем бронирования для каждого элемента корзины
      for (const cartItem of cartItems) {
        const providerRef = `${cartItem.type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Создаем бронирование
        const booking = await tx.booking.create({
          data: {
            userId: user.userId,
            type: cartItem.type,
            status: 'confirmed',
            totalAmount: cartItem.price,
            providerRef,
            details: cartItem.details,
          },
        });

        // Создаем транзакцию списания средств
        const transaction = await tx.transaction.create({
          data: {
            userId: user.userId,
            type: 'debit',
            amount: cartItem.price,
            status: 'completed',
            description: `${cartItem.type.toUpperCase()} booking: ${providerRef}`,
            bookingId: booking.id,
          },
        });

        bookings.push(booking);
        transactions.push(transaction);
      }

      // Обновляем баланс пользователя
      const updatedBalance = await tx.balance.upsert({
        where: { userId: user.userId },
        update: { amount: { decrement: totalAmount } },
        create: { userId: user.userId, amount: 0 - totalAmount },
      });

      // Очищаем корзину
      await tx.cartItem.deleteMany({
        where: { userId: user.userId }
      });

      return { bookings, transactions, updatedBalance };
    });

    console.log(' Checkout completed successfully');
    console.log(' Created bookings:', result.bookings.length);
    console.log(' New balance:', result.updatedBalance.amount);

    return NextResponse.json({
      success: true,
      bookings: result.bookings,
      transactions: result.transactions,
      newBalance: result.updatedBalance.amount,
      totalAmount,
      message: 'Checkout completed successfully'
    });

  } catch (error) {
    console.error(' Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
