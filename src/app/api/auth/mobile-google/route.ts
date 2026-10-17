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
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      );
    }

    console.log(' Mobile Google OAuth request received with authorization code');

    try {
      // В реальном приложении здесь нужно валидировать Google access token
      // Для демонстрации создаем/находим пользователя
      
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

      // Генерируем JWT токен для мобильного приложения
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

      console.log(' Mobile Google OAuth successful for user:', user.email);

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
    console.error(' Mobile Google OAuth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
