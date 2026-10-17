import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Reset user's balance
    const balance = await prisma.balance.upsert({
      where: { userId: session.user.id },
      update: {
        amount: 0,
        currency: 'USD',
      },
      create: {
        userId: session.user.id,
        amount: 0,
        currency: 'USD',
      },
    });

    // Delete all transactions
    await prisma.transaction.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error('Error resetting balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
