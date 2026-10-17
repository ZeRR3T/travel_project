require('dotenv').config();

const { PrismaClient } = require('../node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const adminEmail = process.env.ADMIN_EMAIL;
if (!adminEmail) {
  throw new Error('Set ADMIN_EMAIL in .env before creating the admin user.');
}

const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
if (!initialPassword || initialPassword.length < 16) {
  throw new Error('Set ADMIN_INITIAL_PASSWORD to a password of at least 16 characters.');
}

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log(' Создание пользователя-админа для входа в систему...');

    // Проверяем, есть ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log(' Пользователь уже существует');
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(initialPassword, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Системный администратор',
        password: hashedPassword,
        provider: 'credentials',
        emailVerified: true
      }
    });

    console.log(' Пользователь-админ создан успешно!');
    console.log(' Email:', user.email);
    console.log('');
    console.log('  ВАЖНО: Измените пароль после первого входа!');
    console.log('');

  } catch (error) {
    console.error(' Ошибка при создании пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем создание
createAdminUser();
