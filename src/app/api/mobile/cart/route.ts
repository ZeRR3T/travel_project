import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In-memory хранилище для fallback элементов корзины
const fallbackCartStorage = new Map<string, any[]>();

// GET - получить корзину пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log(' Cart API - Token received:', token ? token.substring(0, 20) + '...' : 'null');
    
    const user = verifyMobileToken(token);
    console.log(' Cart API - User verification result:', user ? { userId: user.userId, email: user.email } : 'null');
    
    if (!user) {
      console.log(' Cart API - User verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(' Fetching cart for user:', user.userId);

    try {
      // Получаем элементы корзины пользователя
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: user.userId },
        orderBy: { addedAt: 'desc' },
      });

      // Десериализуем details обратно в объекты
      const itemsWithDetails = cartItems.map(item => ({
        ...item,
        details: JSON.parse(item.details)
      }));

      const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

      return NextResponse.json({
        success: true,
        items: itemsWithDetails,
        totalPrice,
        itemCount: cartItems.length,
        message: 'Cart retrieved successfully'
      });
    } catch (dbError) {
      console.error(' Database error, returning fallback cart:', dbError);
      
      // Получаем fallback элементы из памяти
      const fallbackItems = fallbackCartStorage.get(user.userId) || [];
      const totalPrice = fallbackItems.reduce((total, item) => total + item.price, 0);
      
      return NextResponse.json({
        success: true,
        items: fallbackItems,
        totalPrice,
        itemCount: fallbackItems.length,
        message: 'Cart retrieved successfully (fallback)'
      });
    }

  } catch (error) {
    console.error(' Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST - добавить элемент в корзину
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log(' Cart POST API - Token received:', token ? token.substring(0, 20) + '...' : 'null');
    
    const user = verifyMobileToken(token);
    console.log(' Cart POST API - User verification result:', user ? { userId: user.userId, email: user.email } : 'null');
    
    if (!user) {
      console.log(' Cart POST API - User verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { type, details, price, currency = 'USD' } = await request.json();
    console.log(' Cart POST API - Request data:', { type, price, currency });

    if (!type || !details || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['hotel', 'flight'].includes(type)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    console.log(' Adding item to cart:', { userId: user.userId, type, price });

    let cartItem;
    
    try {
      // Сериализуем details в JSON строку
      const detailsString = JSON.stringify(details);
      
      // Проверяем, нет ли уже такого элемента в корзине
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          userId: user.userId,
          type,
          details: detailsString
        }
      });

      if (existingItem) {
        // Обновляем существующий элемент
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            price,
            currency,
            updatedAt: new Date()
          }
        });
        console.log(' Updated existing cart item:', cartItem.id);
      } else {
        // Создаем новый элемент
        cartItem = await prisma.cartItem.create({
          data: {
            userId: user.userId,
            type,
            details: detailsString,
            price,
            currency
          }
        });
        console.log(' Created new cart item:', cartItem.id);
      }
    } catch (dbError) {
      console.error(' Database error, using fallback storage:', dbError);
      
      // Создаем mock элемент при ошибке БД
      cartItem = {
        id: 'mock-' + Date.now(),
        userId: user.userId,
        type,
        details: JSON.stringify(details),
        price,
        currency,
        addedAt: new Date(),
        updatedAt: new Date()
      };
      
      // Сохраняем в fallback хранилище
      const fallbackItems = fallbackCartStorage.get(user.userId) || [];
      fallbackItems.push(cartItem);
      fallbackCartStorage.set(user.userId, fallbackItems);
      
      console.log(' Saved to fallback storage, total items:', fallbackItems.length);
      
      return NextResponse.json({
        success: true,
        item: cartItem,
        message: 'Item added to cart (fallback)'
      });
    }

    return NextResponse.json({
      success: true,
      item: cartItem,
      message: 'Item added to cart'
    });

  } catch (error) {
    console.error(' Error adding to cart:', error);
    console.error(' Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'Failed to add item to cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - удалить элемент из корзины или очистить всю корзину
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clear') === 'true';

    if (clearAll) {
      // Очищаем всю корзину
      console.log(' Clearing entire cart for user:', user.userId);

      try {
        // Удаляем все элементы корзины пользователя
        await prisma.cartItem.deleteMany({
          where: { userId: user.userId }
        });

        return NextResponse.json({
          success: true,
          message: 'Cart cleared successfully'
        });
      } catch (dbError) {
        console.error(' Database error, clearing fallback storage:', dbError);
        
        // Очищаем fallback хранилище
        fallbackCartStorage.set(user.userId, []);
        
        console.log(' Cleared fallback storage for user:', user.userId);
        
        return NextResponse.json({
          success: true,
          message: 'Cart cleared successfully (fallback)'
        });
      }
    } else if (itemId) {
      // Удаляем конкретный элемент
      console.log(' Removing item from cart:', { userId: user.userId, itemId });

      try {
        // Удаляем элемент из корзины
        await prisma.cartItem.delete({
          where: {
            id: itemId,
            userId: user.userId // Убеждаемся, что пользователь может удалить только свои элементы
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Item removed from cart'
        });
      } catch (dbError) {
        console.error(' Database error, removing from fallback storage:', dbError);
        
        // Удаляем из fallback хранилища
        const fallbackItems = fallbackCartStorage.get(user.userId) || [];
        const updatedItems = fallbackItems.filter(item => item.id !== itemId);
        fallbackCartStorage.set(user.userId, updatedItems);
        
        console.log(' Removed from fallback storage, remaining items:', updatedItems.length);
        
        return NextResponse.json({
          success: true,
          message: 'Item removed from cart (fallback)'
        });
      }
    } else {
      return NextResponse.json({ error: 'Item ID or clear parameter is required' }, { status: 400 });
    }

  } catch (error) {
    console.error(' Error in cart DELETE operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform cart operation' },
      { status: 500 }
    );
  }
}
