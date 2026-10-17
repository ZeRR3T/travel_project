import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Получить бонусные баллы пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        bonusPoints: {
          include: {
            history: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Создаем бонусные баллы, если их нет
    if (!user.bonusPoints) {
      const bonusPoints = await prisma.bonusPoints.create({
        data: {
          userId: user.id,
          points: 0,
          totalEarned: 0,
          totalSpent: 0
        },
        include: {
          history: []
        }
      });
      
      return NextResponse.json({
        points: 0,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      });
    }

    return NextResponse.json({
      points: user.bonusPoints.points,
      totalEarned: user.bonusPoints.totalEarned,
      totalSpent: user.bonusPoints.totalSpent,
      history: user.bonusPoints.history
    });

  } catch (error) {
    console.error('Error fetching bonus points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Начислить бонусные баллы (только для админов)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, points, reason, source, metadata } = body;

    // Проверяем, является ли пользователь админом
    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email, isActive: true }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Начисляем баллы
    const bonusPoints = await prisma.bonusPoints.upsert({
      where: { userId },
      update: {
        points: { increment: points },
        totalEarned: { increment: points },
        updatedAt: new Date()
      },
      create: {
        userId,
        points,
        totalEarned: points,
        totalSpent: 0
      }
    });

    // Записываем в историю
    await prisma.bonusHistory.create({
      data: {
        bonusPointsId: bonusPoints.id,
        points,
        type: 'earned',
        reason,
        source,
        metadata
      }
    });

    return NextResponse.json({
      success: true,
      newBalance: bonusPoints.points,
      message: `Successfully added ${points} bonus points`
    });

  } catch (error) {
    console.error('Error adding bonus points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
