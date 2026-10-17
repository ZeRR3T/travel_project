import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - очистить корзину пользователя
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyMobileToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(' Clearing cart for user:', user.userId);

    // Удаляем все элементы корзины пользователя
    const result = await prisma.cartItem.deleteMany({
      where: { userId: user.userId }
    });

    console.log(' Cleared cart items:', result.count);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error(' Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
