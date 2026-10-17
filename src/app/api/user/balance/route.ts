import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('=== BALANCE API CALLED ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  try {
    console.log('Getting server session...');
    const session = await getServerSession(authOptions);
    console.log('Session result:', session ? 'exists' : 'not found');
    console.log('Session details:', session ? {
      userId: session.user?.id,
      userEmail: session.user?.email,
      provider: session.user?.provider
    } : 'no session');

    if (!session?.user) {
      console.log('No session or user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', {
      id: session.user.id,
      email: session.user.email
    });

    // Проверяем подключение к базе данных
    console.log('Testing database connection...');
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Проверяем существование пользователя
    console.log('Checking if user exists in database...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true }
    });

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User found in database:', user.email);

    // Get user's balance
    console.log('Fetching balance for user...');
    const balance = await prisma.balance.findUnique({
      where: { userId: session.user.id },
      select: {
        amount: true,
        currency: true,
        updatedAt: true,
      },
    });

    console.log('Balance query result:', balance);

    // If no balance record exists, create one with 0 balance
    if (!balance) {
      console.log('No balance record found, creating new one...');
      try {
        const newBalance = await prisma.balance.create({
          data: {
            userId: session.user.id,
            amount: 0,
            currency: 'USD',
          },
          select: {
            amount: true,
            currency: true,
            updatedAt: true,
          },
        });

        console.log('New balance created:', newBalance);
        return NextResponse.json(newBalance);
      } catch (createError) {
        console.error('Failed to create balance record:', createError);
        return NextResponse.json(
          { error: 'Failed to create balance record' },
          { status: 500 }
        );
      }
    }

    console.log('Returning existing balance:', balance);
    return NextResponse.json(balance);
    
  } catch (error) {
    console.error('Error in balance API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    console.log('=== BALANCE API END ===');
  }
}
