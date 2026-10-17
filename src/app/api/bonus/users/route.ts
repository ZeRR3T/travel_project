import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Получить всех пользователей с бонусными баллами (только для админов)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, является ли пользователь админом
    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email, isActive: true }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Получаем всех пользователей с их бонусными баллами
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        bonusPoints: {
          select: {
            points: true,
            totalEarned: true,
            totalSpent: true,
            history: {
              select: {
                points: true,
                type: true,
                reason: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Форматируем данные для фронтенда
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'Без имени',
      createdAt: user.createdAt,
      bonusPoints: user.bonusPoints ? {
        points: user.bonusPoints.points,
        totalEarned: user.bonusPoints.totalEarned,
        totalSpent: user.bonusPoints.totalSpent,
        history: user.bonusPoints.history.map(record => ({
          points: record.points,
          type: record.type,
          reason: record.reason,
          date: record.createdAt
        }))
      } : {
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      }
    }));

    return NextResponse.json(formattedUsers);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
