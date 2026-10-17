import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt-secret';

const prisma = new PrismaClient();

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    console.log(' Test user login request received');

    // Создаем или находим тестового пользователя
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          provider: 'credentials',
          emailVerified: true
        }
      });
      console.log(' Created new test user:', testUser.id);
    }

    // Создаем JWT токен
    const token = sign(
      { 
        userId: testUser.id, 
        email: testUser.email,
        name: testUser.name,
        provider: 'credentials'
      },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    console.log(' Test user login successful');

    return NextResponse.json({
      message: 'Test user login successful',
      token,
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        image: testUser.image
      }
    });

  } catch (error) {
    console.error(' Test user login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
