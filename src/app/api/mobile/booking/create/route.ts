import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const price = value.trim();
  if (!/^(?:[$€£]\s*)?(?:(?:\d{1,3}(?:,\d{3})+)|\d+)(?:\.\d+)?$/.test(price)) {
    return null;
  }

  const amount = Number(price.replace(/[$€£,\s]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const decodedToken = verifyMobileToken(authHeader ?? '');
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId }
    });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
      throw error;
    }

    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid booking data' }, { status: 400 });
    }

    const { type, details } = body;
    if (type !== 'hotel' && type !== 'flight') {
      return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
    }

    if (!isRecord(details)) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 });
    }

    const amount = parseAmount(details.price);
    if (amount === null) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    let providerRef = '';

    if (type === 'hotel') {
      providerRef = `HOTEL-${Date.now()}`;
    } else {
      const flightNumber = details.flightNumber;
      if (
        typeof flightNumber !== 'string' ||
        !flightNumber.trim() ||
        typeof details.airline !== 'string' ||
        !details.airline.trim() ||
        typeof details.departure !== 'string' ||
        !details.departure.trim() ||
        typeof details.arrival !== 'string' ||
        !details.arrival.trim()
      ) {
        return NextResponse.json({ error: 'Missing required flight details' }, { status: 400 });
      }

      providerRef = `FLIGHT-${flightNumber}-${Date.now()}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const debit = await tx.balance.updateMany({
        where: { userId: user.id, amount: { gte: amount } },
        data: { amount: { decrement: amount } },
      });
      if (debit.count !== 1) {
        return null;
      }

      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          type,
          status: 'confirmed',
          totalAmount: amount,
          providerRef,
          details: details as Prisma.InputJsonValue,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'debit',
          amount,
          status: 'completed',
          description: `${type.toUpperCase()} booking: ${providerRef}`,
          bookingId: booking.id,
        },
      });

      const updatedBalance = await tx.balance.findUniqueOrThrow({
        where: { userId: user.id },
      });

      return { booking, transaction, updatedBalance };
    });

    if (!result) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      transaction: result.transaction,
      newBalance: result.updatedBalance.amount,
    });

  } catch (error) {
    console.error(' Mobile booking error:', error);
    
    // Более детальное логирование ошибки
    if (error instanceof Error) {
      console.error(' Error message:', error.message);
      console.error(' Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
