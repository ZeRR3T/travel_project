import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt-secret';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const { access_token } = await request.json();

    if (!access_token) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    console.log(' Google OAuth request received with token:', access_token ? 'present' : 'missing');

    // В реальном приложении здесь нужно валидировать Google access token
    // Для демонстрации создаем/находим пользователя
    try {
      // Здесь должна быть валидация Google token
      // Пока что создаем тестового пользователя
      
      // Проверяем, есть ли уже пользователь с Google
      let user = await prisma.user.findFirst({
        where: { provider: 'google' }
      });

      if (!user) {
        // Создаем нового пользователя
        user = await prisma.user.create({
          data: {
            email: `google-user-${Date.now()}@example.com`,
            name: 'Google User',
            provider: 'google',
            emailVerified: true
          }
        });
        console.log(' Created new Google user:', user.id);
      }

      // Генерируем JWT токен
      const token = sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name,
          provider: 'google'
        },
        getJwtSecret(),
        { expiresIn: '30d' }
      );

      console.log(' Google OAuth successful for user:', user.email);

      return NextResponse.json({
        message: 'Google authentication successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        }
      });

    } catch (googleError) {
      console.error(' Google token validation error:', googleError);
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error(' Google OAuth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
