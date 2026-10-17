import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId } = paymentIntent.metadata;
      const amount = paymentIntent.amount; // Оставляем в центах для последующей конвертации
      const { currency } = paymentIntent;

      // Создаем транзакцию и обновляем баланс в одной транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Создаем запись о транзакции
        const transaction = await tx.transaction.create({
          data: {
            amount: amount / 100, // Конвертируем из центов в базовую валюту
            currency,
            type: 'deposit',
            status: 'completed',
            userId,
            stripeId: paymentIntent.id,
            description: 'Balance top-up',
          },
        });

        // Обновляем или создаем баланс
        const balance = await tx.balance.upsert({
          where: { userId },
          create: {
            userId,
            amount: amount / 100, // Конвертируем из центов в базовую валюту
            currency,
          },
          update: {
            amount: {
              increment: amount / 100, // Конвертируем из центов в базовую валюту
            },
          },
        });

        return { transaction, balance };
      });

      // Вызываем событие обновления баланса
      eventBus.emit(BALANCE_UPDATED);

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
