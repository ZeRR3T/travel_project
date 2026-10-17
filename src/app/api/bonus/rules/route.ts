import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Получить все правила бонусов
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.bonusRule.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(rules);

  } catch (error) {
    console.error('Error fetching bonus rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Создать новое правило бонусов (только для админов)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, type, points, multiplier, conditions, startDate, endDate } = body;

    const rule = await prisma.bonusRule.create({
      data: {
        name,
        description,
        type,
        points,
        multiplier: multiplier || 1.0,
        conditions,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: adminUser.id
      }
    });

    return NextResponse.json(rule, { status: 201 });

  } catch (error) {
    console.error('Error creating bonus rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
