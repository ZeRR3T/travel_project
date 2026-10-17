
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { getBookingConfirmationEmail } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  // Устанавливаем заголовки CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  console.log('Booking API - Request received');
  console.log('Booking API - Request method:', req.method);
  console.log('Booking API - Request headers:', Object.fromEntries(req.headers.entries()));
  console.log('Booking API - Request URL:', req.url);

  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST'
        }
      }
    );
  }

  // Проверяем тип контента запроса
  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      {
        status: 415,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  try {
    const session = await getServerSession(authOptions);
    console.log('API - Session:', session);

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    let body;
    try {
      body = await req.json();
      console.log('Booking API - Request body:', body);
    } catch (error) {
      console.error('Booking API - JSON parse error:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { type, details } = body;

    if (!type || !details) {
      console.log('Booking API - Missing required fields:', { type, details });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    let amount = 0;
    let providerRef = '';

    // В зависимости от типа бронирования, вызываем соответствующий сервис
    if (type === 'hotel') {
      // Используем уже рассчитанную цену из фронтенда
      amount = details.price || 0;
      providerRef = `HOTEL-${Date.now()}`;
      
      console.log('Booking API - Hotel booking details:', {
        details,
        amount,
        providerRef
      });
    } else if (type === 'flight') {
      // Проверяем наличие необходимых полей
      if (!details.price || !details.flightNumber || !details.airline || !details.departure || !details.arrival) {
        console.error('Booking API - Missing flight details:', details);
        return new Response(
          JSON.stringify({ error: 'Missing required flight details' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // Извлекаем цену из строки (например, "$299.99" -> 299.99)
      const priceString = details.price.toString();
      const priceMatch = priceString.match(/[0-9]+\.?[0-9]*/);
      
      if (!priceMatch) {
        console.error('Booking API - Invalid price format:', priceString);
        return new Response(
          JSON.stringify({ error: 'Invalid price format' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
      
      amount = parseFloat(priceMatch[0]);
      
      if (isNaN(amount) || amount <= 0) {
        console.error('Booking API - Invalid price value:', amount);
        return new Response(
          JSON.stringify({ error: 'Invalid price value' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      providerRef = `FLIGHT-${details.flightNumber}-${Date.now()}`;
      
      console.log('Booking API - Flight booking details:', {
        originalPrice: details.price,
        extractedPrice: priceMatch[0],
        amount,
        providerRef,
        details
      });
    } else {
      console.log('Booking API - Invalid booking type:', type);
      return new Response(
        JSON.stringify({ error: 'Invalid booking type' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Получаем базовый URL для API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Проверяем баланс пользователя перед списанием
    const balance = await prisma.balance.findUnique({
      where: { userId: session.user.id },
      select: {
        amount: true,
        currency: true
      }
    });

    console.log('Booking API - Balance check:', {
      required: amount,
      available: balance?.amount,
      currency: balance?.currency
    });

    console.log('Booking API - Current balance:', balance);

    if (!balance || balance.amount < amount) {
      console.log('Booking API - Insufficient funds:', {
        currentBalance: balance?.amount || 0,
        requiredAmount: amount
      });
      return new Response(
        JSON.stringify({ error: 'Insufficient funds' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    // Проверяем, нет ли уже активного бронирования для этого пользователя и отеля
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        type,
        providerRef,
        status: 'pending',
        createdAt: {
          // Проверяем только бронирования за последние 5 минут
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });

    if (existingBooking) {
      console.log('Booking API - Duplicate booking detected:', existingBooking);
      return new Response(
        JSON.stringify({ error: 'Duplicate booking request' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Проверяем, что amount является числом и больше 0
    if (typeof amount !== 'number' || amount <= 0) {
      console.error('Booking API - Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: 'Invalid booking amount' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('Booking API - Starting transaction with amount:', amount);

    // Вместо HTTP запроса напрямую используем Prisma транзакцию
    const result = await prisma.$transaction(async (tx) => {
      // Создаем бронирование
      const booking = await tx.booking.create({
        data: {
          userId: session.user.id,
          type,
          status: 'pending',
          providerRef,
          details,
          totalAmount: amount,
          currency: 'USD',
        },
      });

      // Создаем транзакцию
      const transaction = await tx.transaction.create({
        data: {
          amount: -amount,
          currency: 'USD',
          type: 'booking',
          status: 'completed',
          userId: session.user.id,
          description: `Booking: ${type}`,
          bookingId: booking.id,
        },
      });

      // Обновляем баланс
      const updatedBalance = await tx.balance.update({
        where: { userId: session.user.id },
        data: {
          amount: {
            decrement: amount,
          },
        },
      });

      return { booking, transaction, balance: updatedBalance };
    });

    console.log('Booking API - Transaction result:', result);

    // Отправляем email с подтверждением бронирования
    try {
      const emailData = {
        userName: session.user.name || 'User',
        bookingId: result.booking.id,
        type,
        details,
        totalAmount: result.booking.totalAmount,
        currency: result.booking.currency,
      };
      
      await sendEmail(
        session.user.email!,
        getBookingConfirmationEmail(emailData)
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Не прерываем процесс, просто логируем ошибку
    }

    // Автоматически начисляем бонусные баллы за бронирование
    try {
      const bonusResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bonus/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          bookingId: result.booking.id,
          amount: result.booking.totalAmount,
          type: type,
          metadata: {
            bookingType: type,
            currency: result.booking.currency,
            details: details
          }
        }),
      });

      if (bonusResponse.ok) {
        const bonusData = await bonusResponse.json();
        console.log(`Bonus points awarded: ${bonusData.pointsEarned} points for user ${session.user.id}`);
      } else {
        console.warn('Failed to award bonus points:', await bonusResponse.text());
      }
    } catch (bonusError) {
      console.warn('Error awarding bonus points:', bonusError);
      // Не прерываем основной процесс, если начисление бонусов не удалось
    }

    return new Response(
      JSON.stringify({ success: true, booking: result.booking }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  } catch (error) {
    console.error('Booking API - Error creating booking:', error);
    console.error('Booking API - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: error?.constructor?.name,
      details: error
    });

    // Проверяем специфические ошибки
    if (error instanceof Error) {
      if (error.message === 'Insufficient funds') {
        return new Response(
          JSON.stringify({ error: 'Insufficient funds' }),
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // Ошибки Prisma
      if (error.message.includes('Prisma')) {
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
