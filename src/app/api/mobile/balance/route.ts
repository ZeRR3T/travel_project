import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fallback хранилище для баланса
const fallbackBalanceStorage = new Map<string, {
  amount: number;
  currency: string;
}>();

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(` [${requestId}] Balance API called at:`, new Date().toISOString());
  
  try {
    // Проверяем авторизацию
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

    console.log(` [${requestId}] Fetching balance for user:`, user.userId);
    console.log(` [${requestId}] User details:`, { userId: user.userId, email: user.email, name: user.name });

    try {
      console.log(` [${requestId}] Attempting to connect to database...`);
      
      // Получаем или создаем баланс пользователя
      const userBalance = await prisma.balance.upsert({
        where: { userId: user.userId },
        update: {},
        create: {
          userId: user.userId,
          amount: 0,
          currency: 'USD'
        }
      });

      console.log(` [${requestId}]  Database connection successful!`);
      console.log(` [${requestId}] User balance from DB:`, userBalance.amount);
      console.log(` [${requestId}] Balance details:`, {
        id: userBalance.id,
        amount: userBalance.amount,
        currency: userBalance.currency,
        createdAt: userBalance.createdAt,
        updatedAt: userBalance.updatedAt
      });

      return NextResponse.json({
        success: true,
        balance: userBalance.amount,
        currency: userBalance.currency,
        message: 'Balance retrieved successfully'
      });

    } catch (dbError: any) {
      console.error(` [${requestId}]  Database connection failed!`);
      console.error(` [${requestId}] Database error details:`, {
        name: dbError?.name,
        message: dbError?.message,
        code: dbError?.code,
        stack: dbError?.stack?.split('\n').slice(0, 3).join('\n')
      });
      console.log(` [${requestId}]  Switching to fallback storage...`);
      
      // Используем fallback хранилище
      let fallbackBalance = fallbackBalanceStorage.get(user.userId);
      
      if (!fallbackBalance) {
        // Создаем новый баланс в fallback хранилище
        fallbackBalance = {
          amount: 0,
          currency: 'USD'
        };
        fallbackBalanceStorage.set(user.userId, fallbackBalance);
        console.log(` [${requestId}]  Created new fallback balance for user:`, user.userId);
        console.log(` [${requestId}]  Fallback balance details:`, fallbackBalance);
      } else {
        console.log(` [${requestId}]  Using existing fallback balance for user:`, user.userId);
        console.log(` [${requestId}]  Existing fallback balance:`, fallbackBalance);
      }

      console.log(` [${requestId}]  Fallback storage status:`, {
        totalUsers: fallbackBalanceStorage.size,
        currentUserBalance: fallbackBalance.amount,
        currency: fallbackBalance.currency
      });

      return NextResponse.json({
        success: true,
        balance: fallbackBalance.amount,
        currency: fallbackBalance.currency,
        message: 'Balance retrieved from fallback storage'
      });
    }

  } catch (error) {
    console.error(` [${requestId}] Error fetching balance:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}