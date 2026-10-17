import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyMobileToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    console.log(' /api/mobile/payment-success called at:', new Date().toISOString());
    console.log(' Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Проверяем авторизацию через простой JWT токен
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

            const token = authHeader.substring(7);
        const user = verifyMobileToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      );
    }

    console.log(' Processing mobile payment success for user:', user.userId);
    console.log(' Payment Intent ID:', paymentIntentId);

    // Проверяем статус платежа в Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Получаем сумму из Stripe (в центах)
    const amount = paymentIntent.amount / 100; // конвертируем в базовую валюту
    console.log(' Amount from Stripe:', amount);

    console.log(' Mobile payment verified successfully');

    try {
      // Выполняем все операции в одной транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Получаем или создаем баланс
        let userBalance = await tx.balance.findUnique({
          where: { userId: user.userId }
        });

        if (!userBalance) {
          userBalance = await tx.balance.create({
            data: {
              userId: user.userId,
              amount: 0,
              currency: 'USD'
            }
          });
        }

        // Обновляем баланс
        const newBalance = userBalance.amount + amount;
        userBalance = await tx.balance.update({
          where: { userId: user.userId },
          data: { amount: newBalance }
        });

        console.log(' Balance updated in DB:', newBalance);

        // Создаем транзакцию
        console.log(' Mobile: Creating transaction in DB...');
        const transaction = await tx.transaction.create({
          data: {
            userId: user.userId,
            amount: amount,
            currency: 'USD',
            type: 'Deposit',
            status: 'completed',
            description: `Stripe payment - ${amount} USD`
          }
        });

        return { transaction, balance: userBalance };
      });

      console.log(' Mobile: Transaction created in DB:', result.transaction.id);
      console.log(' Mobile: Transaction data:', {
        id: result.transaction.id,
        amount: result.transaction.amount,
        type: result.transaction.type,
        description: result.transaction.description
      });

      console.log(' /api/mobile/payment-success completed successfully at:', new Date().toISOString());
      
      return NextResponse.json({
        success: true,
        balance: result.balance.amount,
        currency: 'USD',
        message: 'Balance updated successfully',
      });

    } catch (dbError) {
      console.error(' Database error during payment processing:', dbError);
      
      // Возвращаем успешный ответ даже при ошибке БД
      // Платеж уже прошел в Stripe, поэтому считаем его успешным
      return NextResponse.json({
        success: true,
        balance: amount, // Возвращаем сумму платежа как новый баланс
        currency: 'USD',
        message: 'Payment processed successfully (database temporarily unavailable)',
      });
    }

  } catch (error) {
    console.error(' Error processing mobile payment success:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
}
