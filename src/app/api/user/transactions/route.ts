import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  console.log(' Transactions API called');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log(' No session found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(' User authenticated:', session.user.email);

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit value' },
        { status: 400 }
      );
    }

    // Calculate offset
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(type && { type }),
      ...(status && { status }),
    };

    // Проверяем подключение к базе данных
    try {
      // Проверяем здоровье подключения
      const isHealthy = await prisma.isHealthy();
      
      if (!isHealthy) {
        console.log(' Database connection unhealthy, attempting reconnect...');
        await prisma.reconnect();
      }
    } catch (dbError) {
      console.error(' Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { 
          status: 503,
          headers: {
            'Retry-After': '5',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(' Fetching transactions with params:', { page, limit, type, status, userId: session.user.id });
    
    // Get transactions with pagination
    let transactions, total;
    
    try {
      // Сначала проверяем, существует ли пользователь
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      }).catch(error => {
        console.error(' Error checking user existence:', error);
        throw new Error('Failed to check user existence');
      });

      if (!user) {
        console.error(' User not found:', session.user.id);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Теперь получаем транзакции
      try {
        [transactions, total] = await Promise.all([
          prisma.transaction.findMany({
            where,
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
            select: {
              id: true,
              amount: true,
              currency: true,
              type: true,
              status: true,
              description: true,
              createdAt: true,
            },
          }),
          prisma.transaction.count({ where }),
        ]);

        if (!transactions) {
          throw new Error('Transactions query returned null');
        }

        console.log(' Transactions query successful:', {
          userId: session.user.id,
          transactionsCount: transactions.length,
          total,
          page,
          limit
        });
      } catch (queryError: any) {
        console.error(' Database query error:', {
          error: queryError,
          code: queryError.code,
          message: queryError.message,
          meta: queryError.meta
        });
        
        // Проверяем специфические ошибки Prisma
        if (queryError.code === 'P2021') {
          return NextResponse.json(
            { error: 'Database table not found' },
            { status: 500 }
          );
        }
        
        if (queryError.code === 'P2025') {
          return NextResponse.json(
            { error: 'Record not found' },
            { status: 404 }
          );
        }

        if (queryError.code === 'P2002') {
          return NextResponse.json(
            { error: 'Unique constraint violation' },
            { status: 409 }
          );
        }

        if (queryError.code === 'P2003') {
          return NextResponse.json(
            { error: 'Foreign key constraint violation' },
            { status: 409 }
          );
        }
        
        throw new Error('Failed to fetch transactions data');
      }
    } catch (error: any) {
      console.error(' Transaction processing error:', {
        error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }

    console.log(' Transactions fetched successfully:', { count: transactions.length, total });

    // Проверяем результаты
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Invalid transactions data received');
    }

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error: any) {
    console.error(' Error fetching transactions:', {
      error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Определяем тип ошибки и возвращаем соответствующий статус
    if (error.message === 'Database connection error') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }
    
    if (error.message === 'Invalid transactions data received') {
      return NextResponse.json(
        { error: 'Invalid data received from database' },
        { status: 500 }
      );
    }
    
    if (error.message === 'Failed to fetch transactions data') {
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (error.message === 'Failed to check user existence') {
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    // Проверяем ошибки Prisma, которые могли быть пробрасены выше
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: 'Database table not found' },
        { status: 500 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint violation' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Foreign key constraint violation' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
