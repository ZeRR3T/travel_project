require('dotenv').config();

const { PrismaClient } = require('../node_modules/@prisma/client');

const adminEmail = process.env.ADMIN_EMAIL;
if (!adminEmail) {
  throw new Error('Set ADMIN_EMAIL in .env before initializing the admin.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function initAdmin() {
  try {
    console.log(' Инициализация админа для бонусной системы...');

    // Проверяем, есть ли уже админ
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(' Админ уже существует');
      return;
    }

    // Создаем супер-админа
    const admin = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: 'Системный администратор',
        role: 'super_admin',
        permissions: {
          canManageRules: true,
          canManageSettings: true,
          canManageUsers: true,
          canViewStats: true,
          canInitializeSystem: true
        },
        isActive: true
      }
    });

    console.log(' Админ создан успешно:', admin.email);
    console.log(' Роль:', admin.role);
    console.log(' Email для входа:', admin.email);
    console.log('');
    console.log('  ВАЖНО: Измените email админа на реальный после первого входа!');
    console.log('');

  } catch (error) {
    console.error(' Ошибка при создании админа:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем инициализацию
initAdmin();
