import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fallback хранилище для транзакций
const fallbackTransactionsStorage = new Map<string, any[]>();

export async function GET(request: NextRequest) {
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

    console.log(' Fetching transactions for user:', user.userId);

    // Получаем параметры пагинации
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = 10;

    try {
      // Получаем транзакции из БД
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      });

      console.log(' Found transactions in DB:', transactions.length);

      // Получаем общее количество транзакций для пагинации
      const totalTransactions = await prisma.transaction.count({
        where: { userId: user.userId }
      });

      const pagination = {
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / perPage),
        currentPage: page,
        perPage
      };

      return NextResponse.json({
        success: true,
        transactions,
        pagination,
        message: 'Transactions retrieved successfully'
      });

    } catch (dbError) {
      console.error(' Database error, using fallback storage:', dbError);
      
      // Используем fallback хранилище
      const fallbackTransactions = fallbackTransactionsStorage.get(user.userId) || [];
      
      // Применяем пагинацию к fallback данным
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedTransactions = fallbackTransactions.slice(startIndex, endIndex);

      const pagination = {
        total: fallbackTransactions.length,
        pages: Math.ceil(fallbackTransactions.length / perPage),
        currentPage: page,
        perPage
      };

      console.log(' Found transactions in fallback:', paginatedTransactions.length);

      return NextResponse.json({
        success: true,
        transactions: paginatedTransactions,
        pagination,
        message: 'Transactions retrieved from fallback storage'
      });
    }

  } catch (error) {
    console.error(' Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}