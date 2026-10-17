import Stripe from 'stripe';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export const createPaymentIntent = async (amount: number, currency: string = 'USD', userId: string, source: string = 'web') => {
  try {
    console.log(' Stripe: Creating payment intent with metadata:', { userId, source, amount, currency });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency,
      metadata: {
        userId,
        source, // 'web' или 'mobile_app'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(' Stripe: Payment intent created with ID:', paymentIntent.id);
    console.log(' Stripe: Payment intent metadata:', paymentIntent.metadata);

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Обработка платежей перенесена в /api/payments/webhook/route.ts
