import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Автоматически рассчитать и начислить бонусы за бронирование
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bookingId, amount, type, metadata } = body;

    // Получаем активные правила для данного типа бронирования
    const rules = await prisma.bonusRule.findMany({
      where: {
        type: 'booking',
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } }
        ],
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      }
    });

    // Получаем настройки бонусной системы
    const settings = await prisma.bonusSettings.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    let totalPoints = 0;
    const appliedRules = [];

    // Применяем правила
    for (const rule of rules) {
      let rulePoints = rule.points * rule.multiplier;
      
      // Проверяем условия правила
      if (rule.conditions) {
        const conditions = rule.conditions as any;
        
        // Минимальная сумма
        if (conditions.minAmount && amount < conditions.minAmount) {
          continue;
        }
        
        // Максимальная сумма
        if (conditions.maxAmount && amount > conditions.maxAmount) {
          continue;
        }
        
        // Специальные условия для типа бронирования
        if (conditions.bookingTypes && !conditions.bookingTypes.includes(type)) {
          continue;
        }
      }

      totalPoints += rulePoints;
      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        points: rulePoints,
        multiplier: rule.multiplier
      });
    }

    // Добавляем базовые баллы за сумму (если настроено)
    if (settingsMap.points_per_dollar) {
      const pointsPerDollar = parseFloat(settingsMap.points_per_dollar);
      const amountPoints = Math.floor(amount * pointsPerDollar);
      totalPoints += amountPoints;
      
      appliedRules.push({
        ruleId: 'amount_based',
        ruleName: 'Баллы за сумму',
        points: amountPoints,
        multiplier: 1
      });
    }

    // Проверяем лимиты
    if (settingsMap.max_points_per_month) {
      const maxPerMonth = parseInt(settingsMap.max_points_per_month);
      
      // Получаем баллы за текущий месяц
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const monthPoints = await prisma.bonusHistory.aggregate({
        where: {
          bonusPoints: {
            userId
          },
          type: 'earned',
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          points: true
        }
      });

      const currentMonthPoints = monthPoints._sum.points || 0;
      const remainingPoints = maxPerMonth - currentMonthPoints;
      
      if (remainingPoints < totalPoints) {
        totalPoints = Math.max(0, remainingPoints);
      }
    }

    if (totalPoints > 0) {
      // Начисляем баллы
      const bonusPoints = await prisma.bonusPoints.upsert({
        where: { userId },
        update: {
          points: { increment: totalPoints },
          totalEarned: { increment: totalPoints },
          updatedAt: new Date()
        },
        create: {
          userId,
          points: totalPoints,
          totalEarned: totalPoints,
          totalSpent: 0
        }
      });

      // Записываем в историю
      await prisma.bonusHistory.create({
        data: {
          bonusPointsId: bonusPoints.id,
          points: totalPoints,
          type: 'earned',
          reason: 'Бонус за бронирование',
          source: bookingId,
          metadata: {
            appliedRules,
            bookingType: type,
            amount,
            ...metadata
          }
        }
      });

      return NextResponse.json({
        success: true,
        pointsEarned: totalPoints,
        newBalance: bonusPoints.points,
        appliedRules
      });
    }

    return NextResponse.json({
      success: true,
      pointsEarned: 0,
      message: 'No bonus points earned for this booking'
    });

  } catch (error) {
    console.error('Error calculating bonus points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
