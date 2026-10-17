import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Получить все настройки бонусной системы
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email, isActive: true, role: 'super_admin' },
      select: { id: true }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await prisma.bonusSettings.findMany({
      orderBy: { category: 'asc' }
    });

    // Группируем настройки по категориям
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json(groupedSettings);

  } catch (error) {
    console.error('Error fetching bonus settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Обновить настройки (только для админов)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, является ли пользователь админом
    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email, isActive: true, role: 'super_admin' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body; // Массив настроек для обновления

    const updatedSettings = [];

    for (const setting of settings) {
      const { id, value } = setting;
      
      const updatedSetting = await prisma.bonusSettings.update({
        where: { id },
        data: {
          value,
          updatedAt: new Date(),
          updatedBy: adminUser.id
        }
      });

      updatedSettings.push(updatedSetting);
    }

    return NextResponse.json({
      success: true,
      updatedSettings
    });

  } catch (error) {
    console.error('Error updating bonus settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Инициализировать настройки по умолчанию (только для супер-админов)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, является ли пользователь супер-админом
    const adminUser = await prisma.adminUser.findFirst({
      where: { email: session.user.email, isActive: true, role: 'super_admin' }
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Проверяем, есть ли уже настройки
    const existingSettings = await prisma.bonusSettings.count();
    if (existingSettings > 0) {
      return NextResponse.json({ error: 'Settings already initialized' }, { status: 400 });
    }

    // Создаем настройки по умолчанию
    const defaultSettings = [
      {
        key: 'points_per_booking',
        value: '10',
        description: 'Баллы за каждое бронирование',
        category: 'booking'
      },
      {
        key: 'points_per_dollar',
        value: '0.1',
        description: 'Баллы за каждый доллар потраченный',
        category: 'booking'
      },
      {
        key: 'referral_bonus',
        value: '50',
        description: 'Бонус за приглашение друга',
        category: 'referral'
      },
      {
        key: 'signup_bonus',
        value: '25',
        description: 'Бонус за регистрацию',
        category: 'signup'
      },
      {
        key: 'min_points_to_redeem',
        value: '100',
        description: 'Минимальное количество баллов для обмена',
        category: 'redemption'
      },
      {
        key: 'points_value_usd',
        value: '0.01',
        description: 'Стоимость 1 балла в USD',
        category: 'redemption'
      },
      {
        key: 'max_points_per_month',
        value: '1000',
        description: 'Максимум баллов в месяц',
        category: 'limits'
      }
    ];

    const createdSettings = await prisma.bonusSettings.createMany({
      data: defaultSettings.map(setting => ({
        ...setting,
        isEditable: true
      }))
    });

    return NextResponse.json({
      success: true,
      message: `Created ${createdSettings.count} default settings`
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing bonus settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
