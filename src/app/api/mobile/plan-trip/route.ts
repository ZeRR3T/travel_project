import { NextRequest, NextResponse } from 'next/server';
import { verifyMobileToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// OpenRouter API для планирования поездки
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    console.log(' Trip planning API called');
    
    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = verifyMobileToken(token);
    
    if (!user) {
      console.log(' User verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем данные из запроса
    const requestData = await request.json();
    console.log(' Full request data:', JSON.stringify(requestData, null, 2));
    
    // Получаем актуальные данные корзины из базы данных
    let dbCartItems;
    try {
      dbCartItems = await prisma.cartItem.findMany({
        where: { userId: user.userId },
        orderBy: { addedAt: 'desc' },
      });
      console.log(' Cart items from DB:', dbCartItems.length);
    } catch (dbError) {
      console.error(' Database connection error:', dbError);
      // Если база данных недоступна, используем данные из запроса
      console.log(' Falling back to request data due to DB error');
      const { cartItems: requestCartItems } = requestData;
      if (!requestCartItems || requestCartItems.length === 0) {
        return NextResponse.json({ error: 'No items in cart to plan trip' }, { status: 400 });
      }
      dbCartItems = requestCartItems;
    }

    if (!dbCartItems || dbCartItems.length === 0) {
      console.log(' No items found in cart (DB check)');
      return NextResponse.json({ 
        success: false,
        error: 'No items in cart to plan trip',
        message: 'Please add items to your cart first'
      }, { status: 400 });
    }

    // Десериализуем details обратно в объекты
    const cartItems = dbCartItems.map((item: any) => ({
      ...item,
      details: JSON.parse(item.details)
    }));
    
    // Извлекаем даты из параметров запроса
    let startDate, endDate;
    const { searchQuery, userPreferences, departureDate, returnDate, dates: requestDates } = requestData;
    
    console.log(' DEBUG: All request parameters:', { searchQuery, departureDate, returnDate, requestDates });
    
    // ПРИОРИТЕТ 1: Даты из параметра dates (мобильное приложение)
    if (requestDates) {
      console.log(' Found dates parameter:', requestDates);
      // Парсим даты из строки типа "Thu, Sep 13 - Wed, Sep 17"
      const dateMatch = requestDates.match(/(\w{3}),\s*(\w{3})\s*(\d{1,2})\s*[-–—]\s*(\w{3}),\s*(\w{3})\s*(\d{1,2})/i);
      if (dateMatch) {
        const [, startDayOfWeek, startMonth, startDay, endDayOfWeek, endMonth, endDay] = dateMatch;
        const currentYear = new Date().getFullYear();
        const monthMap: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
          'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        const startMonthNum = monthMap[startMonth.toLowerCase()];
        const endMonthNum = monthMap[endMonth.toLowerCase()];
        
        if (startMonthNum && endMonthNum) {
          startDate = `${currentYear}-${startMonthNum}-${startDay.padStart(2, '0')}`;
          endDate = `${currentYear}-${endMonthNum}-${endDay.padStart(2, '0')}`;
          console.log(' Successfully parsed dates from dates parameter:', { startDate, endDate });
        }
      }
    }
    
    // ПРИОРИТЕТ 2: Даты из departureDate/returnDate
    if (!startDate || !endDate) {
    if (departureDate && returnDate) {
      console.log(' Found dates in request:', { departureDate, returnDate });
      startDate = departureDate;
      endDate = returnDate;
      }
    }
    
    // ПРИОРИТЕТ 3: Даты из деталей рейса
    if (!startDate || !endDate) {
      if (cartItems?.[0]?.details?.date && cartItems?.[0]?.details?.returnDate) {
      console.log(' Found dates in flight details:', {
        date: cartItems[0].details.date,
        returnDate: cartItems[0].details.returnDate
      });
      startDate = cartItems[0].details.date;
      endDate = cartItems[0].details.returnDate;
      }
    }
    
    // ПРИОРИТЕТ 4: Даты из flightDeparture/flightArrival (мобильное приложение)
    if (!startDate || !endDate) {
      const { flightDeparture, flightArrival } = requestData;
      if (flightDeparture?.date && flightArrival?.date) {
        console.log(' Found dates in flightDeparture/flightArrival:', {
          departureDate: flightDeparture.date,
          arrivalDate: flightArrival.date
        });
        // Если даты одинаковые, используем одну дату
        if (flightDeparture.date === flightArrival.date) {
          startDate = flightDeparture.date;
          endDate = flightDeparture.date;
        } else {
          startDate = flightDeparture.date;
          endDate = flightArrival.date;
        }
      }
    }
    
    // ПРИОРИТЕТ 5: Одна дата из параметра dates (мобильное приложение)
    if ((!startDate || !endDate) && requestData.dates) {
      const singleDate = requestData.dates.match(/(\w{3}, \w{3} \d{1,2})/);
      if (singleDate) {
        // Преобразуем дату из формата "Thu, Sep 25" в "2025-09-25"
        const [, dayOfWeek, month, day] = singleDate[1].match(/(\w{3}), (\w{3}) (\d{1,2})/);
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
          'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        const monthNum = monthMap[month];
        if (monthNum) {
          const currentYear = new Date().getFullYear();
          const formattedDate = `${currentYear}-${monthNum}-${day.padStart(2, '0')}`;
          console.log(' Found single date in dates parameter:', formattedDate);
          startDate = formattedDate;
          endDate = formattedDate;
        }
      }
    }
    
    // Проверяем и форматируем даты
    let formattedDates;
    if (startDate && endDate) {
      console.log(' Processing dates:', { startDate, endDate });
      
      // Проверяем формат дат
      const isValidDate = (dateStr: string) => {
        if (!dateStr) return false;
        
        // Если строка содержит двоеточие, это время, а не дата
        if (dateStr.includes(':')) {
          console.log(' Date validation: time detected, not date:', dateStr);
          return false;
        }
        
        const date = new Date(dateStr);
        const isValid = !isNaN(date.getTime());
        console.log(' Date validation:', { dateStr, isValid });
        return isValid;
      };
      
      if (isValidDate(startDate) && isValidDate(endDate)) {
        formattedDates = { 
          startDate: new Date(startDate).toISOString().split('T')[0],
          endDate: new Date(endDate).toISOString().split('T')[0]
        };
        console.log(' Valid dates found:', formattedDates);
        
        // Дополнительная проверка расчета дней
        const start = new Date(formattedDates.startDate);
        const end = new Date(formattedDates.endDate);
        const timeDiff = end.getTime() - start.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        
        console.log(' Days calculation check:', {
          startDate: formattedDates.startDate,
          endDate: formattedDates.endDate,
          timeDiff,
          daysDiff,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        });
      } else {
        console.log(' Invalid date format:', { startDate, endDate });
      }
    } else {
      console.log(' No dates found in request or flight details');
    }
    console.log(' Trip planning data:', {
      cartItemsCount: cartItems?.length || 0, 
      searchQuery,
      userPreferences,
      formattedDates
    });

    // Анализируем searchQuery для дат
    console.log(' Search query:', searchQuery?.substring(0, 100) + '...');


    // Анализируем элементы корзины для извлечения информации о поездке
    const tripInfo = analyzeCartItems(cartItems, searchQuery, formattedDates, requestDates);
    console.log(' Extracted trip info:', tripInfo);
    
    if (!tripInfo) {
      console.log(' Failed to analyze cart items');
      return NextResponse.json({ error: 'Failed to analyze trip information' }, { status: 400 });
    }

    // Определяем тип плана (детальный или рекомендации)
    const planType = determinePlanType(tripInfo, cartItems);
    console.log(' Determined plan type:', planType);

    // Создаем промпт в зависимости от типа плана
    const prompt = planType === 'recommendations'
      ? createRecommendationsPrompt(tripInfo)
      : createDetailedPlanPrompt(tripInfo, searchQuery, userPreferences);
    
    console.log(' Generated prompt for OpenRouter (type:', planType, ')');

    // Отправляем запрос к OpenRouter без ограничений
    console.log(' OpenRouter request:', { days: tripInfo.effectiveDays });

    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(' OpenRouter API error:', aiResponse.status, aiResponse.statusText, errorText);
      throw new Error(`OpenRouter API error: ${aiResponse.status} ${aiResponse.statusText} - ${errorText}`);
    }

    const data = await aiResponse.json();
    console.log(' OpenRouter response data:', JSON.stringify(data, null, 2));
    
    const tripPlan = data.choices[0]?.message?.content || '';
    console.log(' OpenRouter response received, length:', tripPlan.length);

    // Парсим ответ от OpenRouter в структурированный формат
    let structuredPlan;
    try {
      structuredPlan = parseTripPlan(tripPlan);
      console.log(' Parsed structured plan:', JSON.stringify(structuredPlan, null, 2));
    } catch (parseError) {
      console.error(' Error parsing trip plan:', parseError);
      console.log(' Raw trip plan response:', tripPlan);
      
      // Возвращаем ошибку вместо fallback плана
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response', 
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          rawResponse: tripPlan.substring(0, 500) + '...'
        },
        { status: 500 }
      );
    }

    // Сохраняем план поездки в базу данных
    let savedPlan;
    try {
      savedPlan = await prisma.tripPlan.create({
      data: {
        userId: user.userId,
        title: structuredPlan.title || 'My Trip Plan',
        destination: tripInfo.destination,
        startDate: tripInfo.startDate,
        endDate: tripInfo.endDate,
        planData: JSON.stringify(structuredPlan),
        status: 'active'
      }
    });
    } catch (dbError) {
      console.error(' Database error saving trip plan:', dbError);
      // Если не удалось сохранить в БД, все равно возвращаем план
      savedPlan = { id: 'temp-' + Date.now() };
    }

    console.log(' Trip plan saved to database:', savedPlan.id);

    // Формируем ответ в зависимости от типа плана
    const responseData = {
      success: true,
      planId: savedPlan.id,
      message: 'Trip plan generated successfully',
      plan: structuredPlan,
      // Отправляем planDays только для детального плана
      ...(planType === 'detailed' ? { 
        planDays: structuredPlan.days?.length || 0,
        isLongTrip: tripInfo.effectiveDays > 7,
        totalTripDays: tripInfo.effectiveDays,
        plannedDays: Math.min(tripInfo.effectiveDays, 7)
      } : {})
    };

    console.log(' Final response data:', {
      type: planType,
      hasDays: planType === 'detailed',
      planId: responseData.planId,
      planTitle: structuredPlan.title,
      planType: planType
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error(' Trip planning error:', error);
    
    if (error instanceof Error) {
      console.error(' Error message:', error.message);
      console.error(' Error stack:', error.stack);
      
      // Специальная обработка для таймаута
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log(' Request timed out');
        return NextResponse.json(
          { 
            error: 'Trip plan generation timed out', 
            details: 'The AI request took too long to complete. Please try again.',
            timeout: true
          },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate trip plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Функция для анализа элементов корзины
function analyzeCartItems(cartItems: any[], searchQuery?: string, dates?: { startDate: string; endDate: string }, directDates?: string) {
  const tripInfo = {
    destination: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    flightInfo: null as any,
    hotelInfo: null as any,
    activities: [] as any[],
    totalDays: 0,
    effectiveDays: 0, // Эффективные дни с учетом времени прилета/вылета
    arrivalDay: '', // День фактического прибытия
    departureDay: '', // День фактического отъезда
    searchQuery: searchQuery || '' // Добавляем searchQuery для проверки
  };

  // Анализируем searchQuery для дат
  const testPatterns = [
    /(\w{3}),\s*(\w{3})\s*(\d{1,2})\s*[-–—]\s*(\w{3}),\s*(\w{3})\s*(\d{1,2})$/i,
    /(\w{3}),\s*(\w{3})\s*(\d{1,2})\s*[-–—]\s*(\w{3}),\s*(\w{3})\s*(\d{1,2})/i,
    /(?:\w+,\s*)?(\w{3})\s*(\d{1,2})\s*[-–—]\s*(?:\w+,\s*)?(\w{3})\s*(\d{1,2})/i
  ];
  
  // Даты передаются напрямую через параметр dates
  
  // ПРИОРИТЕТ 1: Используем даты из directDates (мобильное приложение)
  if (directDates && (!tripInfo.startDate || !tripInfo.endDate)) {
    console.log(' Using directDates parameter:', directDates);
    const dateMatch = directDates.match(/(\w{3}),\s*(\w{3})\s*(\d{1,2})\s*[-–—]\s*(\w{3}),\s*(\w{3})\s*(\d{1,2})/i);
    if (dateMatch) {
      const [, startDayOfWeek, startMonth, startDay, endDayOfWeek, endMonth, endDay] = dateMatch;
      const currentYear = new Date().getFullYear();
      const monthMap: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      
      const startMonthNum = monthMap[startMonth.toLowerCase()];
      const endMonthNum = monthMap[endMonth.toLowerCase()];
      
      if (startMonthNum && endMonthNum) {
        tripInfo.startDate = `${currentYear}-${startMonthNum}-${startDay.padStart(2, '0')}`;
        tripInfo.endDate = `${currentYear}-${endMonthNum}-${endDay.padStart(2, '0')}`;
        console.log(' Successfully set dates from directDates:', { startDate: tripInfo.startDate, endDate: tripInfo.endDate });
      }
    }
  }

  // ЗАТЕМ анализируем элементы корзины для извлечения дополнительной информации
  cartItems.forEach(item => {
    if (item.type === 'flight') {
      const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
      tripInfo.flightInfo = details;
      
      // Извлекаем даты и время из информации о рейсе ТОЛЬКО если даты еще не найдены
      if (!tripInfo.startDate || !tripInfo.endDate) {

      if (details.foundCategories?.length > 0) {
        const foundDates = details.foundCategories.find((cat: any) => cat.type === 'dates');
        if (foundDates) {
          tripInfo.startDate = foundDates.startDate;
          tripInfo.endDate = foundDates.endDate;
          tripInfo.startTime = foundDates.startTime || '';
          tripInfo.endTime = foundDates.endTime || '';
        }
      } else if (details.categories?.length > 0) {
        const foundDates = details.categories.find((cat: any) => cat.type === 'dates');
        if (foundDates) {
          tripInfo.startDate = foundDates.startDate;
          tripInfo.endDate = foundDates.endDate;
          tripInfo.startTime = foundDates.startTime || '';
          tripInfo.endTime = foundDates.endTime || '';
        }
      } else if (details.foundDates) {
        tripInfo.startDate = details.foundDates.startDate;
        tripInfo.endDate = details.foundDates.endDate;
        tripInfo.startTime = details.foundDates.startTime || '';
        tripInfo.endTime = details.foundDates.endTime || '';
      } else if (details.dates) {
        tripInfo.startDate = details.dates.startDate;
        tripInfo.endDate = details.dates.endDate;
        tripInfo.startTime = details.dates.startTime || '';
        tripInfo.endTime = details.dates.endTime || '';
        } else if (details.departureDate && details.arrivalDate) {
          // Прямые поля с датами
          console.log(' Found dates in departureDate/arrivalDate:', {
            departureDate: details.departureDate,
            arrivalDate: details.arrivalDate
          });
          tripInfo.startDate = details.departureDate;
          tripInfo.endDate = details.arrivalDate;
        } else if (details.date) {
          // Одна дата - используем как дату отъезда, добавляем день для возврата
          console.log(' Found single date:', details.date);
          tripInfo.startDate = details.date;
          const startDate = new Date(details.date);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          tripInfo.endDate = endDate.toISOString().split('T')[0];
      } else if (dates) {
        // Используем даты из параметра dates
        console.log(' Using dates from request:', dates);
        tripInfo.startDate = dates.startDate;
        tripInfo.endDate = dates.endDate;
      } else {
        // Fallback на старую логику
        if (details.arrival?.date) {
          tripInfo.startDate = details.arrival.date;
        } else if (details.arrivalDate) {
          tripInfo.startDate = details.arrivalDate;
        } else if (details.date) {
          tripInfo.startDate = details.date;
        }
        
        if (details.arrival?.time) {
          tripInfo.startTime = details.arrival.time;
        } else if (details.arrivalTime) {
          tripInfo.startTime = details.arrivalTime;
        } else if (details.time) {
          tripInfo.startTime = details.time;
        }
        
        if (details.departure?.date) {
          tripInfo.endDate = details.departure.date;
        } else if (details.departureDate) {
          tripInfo.endDate = details.departureDate;
        }
        
        if (details.departure?.time) {
          tripInfo.endTime = details.departure.time;
        } else if (details.departureTime) {
          tripInfo.endTime = details.departureTime;
          }
        }
      }
      
      // Определяем направление
      if (details.arrival?.city) {
        // Если есть город, используем его
        tripInfo.destination = details.arrival.city;
      } else if (details.arrival?.airport) {
        // Если есть только аэропорт, пытаемся извлечь город
        const airportName = details.arrival.airport;
        // Убираем слова "Airport", "International", "Terminal" и т.д.
        const cityName = airportName
          .replace(/\b(airport|international|terminal|aeroport|charles de gaulle)\b/gi, '')
          .replace(/[A-Z]{3,4}/, '') // Убираем код аэропорта
          .split(',')[0] // Берем только первую часть до запятой
          .trim();
        tripInfo.destination = cityName || airportName;
      } else if (details.arrival) {
        // Если есть только строка, пытаемся извлечь город
        const arrivalString = details.arrival.toString();
        const cityName = arrivalString
          .replace(/\b(airport|international|terminal|aeroport|charles de gaulle)\b/gi, '')
          .replace(/[A-Z]{3,4}/, '')
          .split(',')[0]
          .trim();
        tripInfo.destination = cityName || arrivalString;
      }
    }
    
    if (item.type === 'hotel') {
      const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
      tripInfo.hotelInfo = details;
      
      // Приоритет: даты из отеля (более точные) ТОЛЬКО если даты еще не найдены
      if ((!tripInfo.startDate || !tripInfo.endDate)) {
        // Проверяем, что checkIn и checkOut содержат даты, а не время
        if (details.checkIn && !details.checkIn.includes(':')) {
          // Если checkIn не содержит двоеточие, это дата
        tripInfo.startDate = details.checkIn;
          console.log(' Using hotel checkIn date:', details.checkIn);
        } else if (details.checkIn && details.checkIn.includes(':')) {
          // Если checkIn содержит двоеточие, это время - не используем как дату
          console.log(' Hotel checkIn is time, not date:', details.checkIn);
      }
        
        if (details.checkOut && !details.checkOut.includes(':')) {
          // Если checkOut не содержит двоеточие, это дата
        tripInfo.endDate = details.checkOut;
          console.log(' Using hotel checkOut date:', details.checkOut);
        } else if (details.checkOut && details.checkOut.includes(':')) {
          // Если checkOut содержит двоеточие, это время - не используем как дату
          console.log(' Hotel checkOut is time, not date:', details.checkOut);
        }
      }
    }
  });

  // Вычисляем количество дней с учетом времени
  console.log(' DEBUG: Final dates before calculation:', {
    startDate: tripInfo.startDate,
    endDate: tripInfo.endDate,
    cartItemsCount: cartItems.length,
    flightInfo: tripInfo.flightInfo,
    hotelInfo: tripInfo.hotelInfo
  });
  
  if (tripInfo.startDate && tripInfo.endDate) {
    const start = new Date(tripInfo.startDate);
    const end = new Date(tripInfo.endDate);
    
      // Проверяем, одинаковые ли даты
      if (start.getTime() === end.getTime()) {
        console.log(' Same day trip detected');
        tripInfo.totalDays = 1;
        tripInfo.effectiveDays = 1;
      } else {
    // Расчет дней: разница между датами + 1 (включая начальный и конечный дни)
    const timeDiff = end.getTime() - start.getTime();
    tripInfo.totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    console.log(' Days calculation:', {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timeDiff,
      daysBeforeAdd: Math.ceil(timeDiff / (1000 * 60 * 60 * 24)),
      totalDays: tripInfo.totalDays
    });
    
    // Определяем эффективные дни с учетом времени прилета/вылета
        const arrivalTime = tripInfo.startTime ? parseTime(tripInfo.startTime) : null;
        const departureTime = tripInfo.endTime ? parseTime(tripInfo.endTime) : null;
    
    // Базовая логика: используем реальное количество дней
    let effectiveDays = tripInfo.totalDays;
    
    // Если прилетаем поздно (после 18:00), считаем что первый день не полный
    // Если вылетаем рано (до 12:00), считаем что последний день не полный
    if (tripInfo.totalDays > 1) {
      if (arrivalTime && arrivalTime.hours >= 18) {
        effectiveDays -= 0.5; // Первый день не полный
      }
      
      if (departureTime && departureTime.hours < 12) {
        effectiveDays -= 0.5; // Последний день не полный
      }
    }
    
    // Округляем вверх, но не принуждаем минимум 1 день
    tripInfo.effectiveDays = Math.ceil(effectiveDays);
      }
    
    console.log(' DEBUG: Days calculation result:', {
      totalDays: tripInfo.totalDays,
      effectiveDays: tripInfo.effectiveDays,
      startDate: tripInfo.startDate,
      endDate: tripInfo.endDate,
      startTime: tripInfo.startTime,
      endTime: tripInfo.endTime
    });
    
    // Определяем дни фактического прибытия и отъезда
    tripInfo.arrivalDay = formatDateForDisplay(tripInfo.startDate);
    tripInfo.departureDay = formatDateForDisplay(tripInfo.endDate);
  } else {
    // Если даты не найдены, логируем это
    console.log(' DEBUG: No dates found in searchQuery or cart items');
    
    // Если все еще нет дат, используем текущую дату
    if (!tripInfo.startDate || !tripInfo.endDate) {
      console.log(' DEBUG: Still no dates, using current date');
      
      // Используем только текущую дату
      const today = new Date();
      
      // Проверяем, что дата валидна
      if (isNaN(today.getTime())) {
        console.log(' Error creating current date');
        tripInfo.startDate = '';
        tripInfo.endDate = '';
        tripInfo.totalDays = 0;
        tripInfo.effectiveDays = 0;
        tripInfo.arrivalDay = 'Date not specified';
        tripInfo.departureDay = 'Date not specified';
        return;
      }
      
      const currentDate = today.toISOString().split('T')[0];
      tripInfo.startDate = currentDate;
      tripInfo.endDate = currentDate;
      
      // Для однодневной поездки
      tripInfo.totalDays = 1;
      tripInfo.effectiveDays = 1;
      tripInfo.arrivalDay = formatDateForDisplay(currentDate);
      tripInfo.departureDay = formatDateForDisplay(currentDate);
      
      console.log(' Using current date:', {
        date: currentDate,
            totalDays: tripInfo.totalDays,
            effectiveDays: tripInfo.effectiveDays
          });
    }
  }

  return tripInfo;
}

// Функция для парсинга времени
function parseTime(timeString: string) {
  if (!timeString) return null;
  
  console.log(' Parsing time:', timeString);
  
  // Пытаемся распарсить различные форматы времени
  const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3]?.toUpperCase();
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    console.log(' Parsed time:', { hours, minutes, period });
    return { hours, minutes };
  }
  
  console.log(' Failed to parse time:', timeString);
  return null;
}

// Функция для форматирования даты для отображения
function formatDateForDisplay(dateString: string) {
  if (!dateString) return '';
  
  try {
    console.log(' Formatting date:', dateString);
    const date = new Date(dateString);
    
    // Проверяем, что дата валидна
    if (isNaN(date.getTime())) {
      console.log(' Invalid date:', dateString);
      return dateString;
    }
    
    const formatted = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    console.log(' Formatted date:', formatted);
    return formatted;
  } catch (error) {
    console.log(' Error formatting date:', dateString, error);
    return dateString;
  }
}

// Функция для создания промпта для Gemini
function createTripPlanningPrompt(tripInfo: any, searchQuery: string, userPreferences: any) {
  // Используем все дни поездки без ограничений
  const effectiveDays = tripInfo.effectiveDays;
  
  console.log(' Trip planning days:', {
    effectiveDays: effectiveDays,
    totalDays: tripInfo.totalDays
  });

  return `
You are a professional travel planner. Create a detailed trip plan based on the following information:

TRIP INFORMATION:
- Destination: ${tripInfo.destination || 'Not specified'}
- Travel dates: ${tripInfo.startDate} - ${tripInfo.endDate}
- Total calendar days: ${tripInfo.totalDays}
- Effective travel days: ${effectiveDays} (considering flight times)
- Arrival day: ${tripInfo.arrivalDay}
- Departure day: ${tripInfo.departureDay}
- Search query: ${searchQuery || 'Not specified'}

BOOKING INFORMATION:
${tripInfo.flightInfo ? `- Flight: ${tripInfo.flightInfo.airline} ${tripInfo.flightInfo.flightNumber}
  From: ${tripInfo.flightInfo.departure} (${tripInfo.startTime || 'Time not specified'})
  To: ${tripInfo.flightInfo.arrival} (${tripInfo.endTime || 'Time not specified'})
  Price: $${tripInfo.flightInfo.price}` : ''}
${tripInfo.hotelInfo ? `- Hotel: ${tripInfo.hotelInfo.name}` : ''}

IMPORTANT: Create a trip plan for the DESTINATION city (where the flight goes), not for intermediate stops!

TIME CONSIDERATIONS:
- If arrival time is late (after 6 PM), the first day should be light with minimal activities
- If departure time is early (before 12 PM), the last day should be minimal
- Plan activities based on EFFECTIVE TRAVEL DAYS (${effectiveDays} days)
- Consider jet lag and travel fatigue in your planning
- Schedule more intensive activities for full days, lighter activities for partial days
- For very short trips (1 day), focus on the most iconic attractions
- For long trips (${tripInfo.effectiveDays} days), plan only the first ${effectiveDays} days in detail

USER PREFERENCES:
${userPreferences ? JSON.stringify(userPreferences) : 'Not specified'}

CREATE A TRIP PLAN IN THE FOLLOWING JSON FORMAT:
{
  "title": "Trip title",
  "summary": "Brief trip description",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "description": "Detailed description of the day's theme and highlights",
      "morningActivities": [
        {
          "time": "09:00",
          "title": "Morning activity name",
          "description": "Detailed description of morning activity with historical context, cultural significance, and what makes it special",
          "location": "Full address with neighborhood context and nearby landmarks",
          "duration": "2-3 hours",
          "type": "sightseeing|culture",
          "historicalContext": "Historical background and cultural significance",
          "photographyTips": "Best photo spots, lighting conditions, and composition tips",
          "cost": "Detailed cost breakdown (tickets, fees, etc.)",
          "openingHours": "Opening hours and best times to visit",
          "accessibility": "Accessibility information and facilities",
          "localTransport": "How to get there using local transportation",
          "tips": "Morning-specific tips (best light for photos, shorter queues, local customs)",
          "alternatives": ["Early morning alternatives with descriptions"],
          "nearbyAttractions": ["Other attractions in the same area"],
          "localInsights": "Insider tips from locals and hidden gems nearby"
        }
      ],
      "afternoonActivities": [
        {
          "time": "14:00",
          "title": "Afternoon activity name",
          "description": "Detailed afternoon activity description with cultural context and highlights",
          "location": "Full address and area highlights with neighborhood context",
          "duration": "2-3 hours",
          "type": "culture|entertainment",
          "historicalContext": "Historical background and cultural significance",
          "photographyTips": "Best photo spots and lighting conditions",
          "cost": "Detailed cost breakdown",
          "openingHours": "Opening hours and peak times",
          "accessibility": "Accessibility information",
          "localTransport": "Transportation options",
          "tips": "Afternoon-specific advice, weather considerations, local customs",
          "alternatives": ["Indoor alternatives for weather with descriptions"],
          "nearbyAttractions": ["Other attractions in the same area"],
          "localInsights": "Local recommendations and hidden spots"
        }
      ],
      "eveningActivities": [
        {
          "time": "19:00",
          "title": "Evening activity name",
          "description": "Evening entertainment or cultural activity with detailed context",
          "location": "Venue address and area nightlife context",
          "duration": "2-3 hours",
          "type": "entertainment|culture",
          "historicalContext": "Cultural significance and local traditions",
          "photographyTips": "Evening photography tips and best spots",
          "cost": "Cost breakdown including any fees",
          "openingHours": "Evening hours and best times",
          "accessibility": "Accessibility information",
          "localTransport": "Evening transportation options",
          "tips": "Evening safety tips, dress code, local customs, reservation requirements",
          "alternatives": ["Alternative evening plans with descriptions"],
          "nearbyAttractions": ["Other evening venues in the area"],
          "localInsights": "Local nightlife tips and recommendations"
        }
      ],
      "meals": [
        {
          "time": "08:00",
          "type": "breakfast",
          "suggestion": "Local breakfast spot",
          "description": "Traditional breakfast options and specialties with cultural context",
          "location": "Address and neighborhood with local context",
          "cuisine": "Type of cuisine and local specialties",
          "priceRange": "Detailed price range and what to expect",
          "atmosphere": "Restaurant atmosphere and local dining culture",
          "mustTry": "Must-try dishes and local favorites",
          "reservation": "Reservation requirements and best times",
          "dressCode": "Dress code and local customs",
          "tips": "Local breakfast customs, must-try items, cultural dining etiquette",
          "alternatives": ["Quick breakfast options with descriptions"],
          "nearbyAttractions": ["Attractions near the restaurant"],
          "localInsights": "Local dining tips and hidden gems"
        },
        {
          "time": "12:00",
          "type": "lunch",
          "suggestion": "Restaurant name and cuisine",
          "description": "Popular lunch dishes and specialties with cultural background",
          "location": "Restaurant district details and neighborhood context",
          "cuisine": "Cuisine type and local specialties",
          "priceRange": "Detailed price range and value for money",
          "atmosphere": "Restaurant atmosphere and local dining culture",
          "mustTry": "Signature dishes and local favorites",
          "reservation": "Reservation requirements and peak hours",
          "dressCode": "Dress code and local customs",
          "tips": "Lunch specials, busy hours, local dining customs",
          "alternatives": ["Casual lunch alternatives with descriptions"],
          "nearbyAttractions": ["Attractions near the restaurant"],
          "localInsights": "Local lunch culture and recommendations"
        },
        {
          "time": "19:00",
          "type": "dinner",
          "suggestion": "Evening dining experience",
          "description": "Signature dishes and dining atmosphere with cultural context",
          "location": "Restaurant and nightlife area with local context",
          "cuisine": "Cuisine type and evening specialties",
          "priceRange": "Detailed price range and evening pricing",
          "atmosphere": "Evening atmosphere and local dining culture",
          "mustTry": "Evening specialties and local favorites",
          "reservation": "Reservation requirements and evening availability",
          "dressCode": "Evening dress code and local customs",
          "tips": "Reservation requirements, dress code, evening dining customs",
          "alternatives": ["Alternative dining options with descriptions"],
          "nearbyAttractions": ["Evening attractions near the restaurant"],
          "localInsights": "Local evening dining culture and nightlife tips"
        }
      ],
      "evening": {
        "entertainment": ["Evening activity suggestions"],
        "nightlife": ["If applicable: bars, shows, events"],
        "relaxation": ["Peaceful spots for unwinding"]
      }
    }
  ],
  "dayPlanning": {
    "morningRoutine": "Best times and places for breakfast",
    "peakHours": "When to visit popular attractions",
    "eveningOptions": "Different ways to spend evenings"
  },
  "localTips": {
    "customs": "Important local customs and etiquette",
    "navigation": "How to get around efficiently",
    "safety": "Area-specific safety advice",
    "savings": "Money-saving tips and deals"
  },
  "weatherConsiderations": {
    "seasonal": "Weather patterns for the dates",
    "preparation": "What to wear/bring",
    "alternatives": "Indoor backup plans"
  },
  "emergencyInfo": {
    "emergencyNumbers": ["Local emergency contacts"],
    "hospitals": ["Nearby hospitals with English service"],
    "pharmacies": ["24-hour pharmacies"],
    "embassy": "Nearest embassy/consulate"
  }
}

CRITICAL TIME ORGANIZATION RULES:
1. ALL activities within each day MUST be in CHRONOLOGICAL ORDER
2. Use 24-hour format for all times (09:00, 14:30, 19:00)
3. Start each day with the earliest activity
4. Ensure logical meal times (lunch 12:00-14:00, dinner after 18:00)
5. Include buffer time between activities for travel/rest
6. Consider attraction opening hours and peak times

CONTENT REQUIREMENTS:
1. Focus on FAMOUS LANDMARKS and BEAUTIFUL PLACES
2. Include cultural sites, museums, parks, viewpoints
3. Suggest both budget and premium dining options
4. Add practical tips for each activity
5. Make the plan flexible with alternatives
6. Consider seasonal events and festivals
7. Include photo opportunities and scenic spots
8. DO NOT include transportation details

Respond ONLY in JSON format, without additional text.

IMPORTANT REQUIREMENTS:
1. Create a COMPREHENSIVE and DETAILED plan focusing on SIGHTSEEING and BEAUTIFUL PLACES
2. Plan for ALL ${effectiveDays} DAYS of the trip in detail
3. If arriving late (after 6 PM), make the first day light (check-in, dinner, rest)
4. If departing early (before 12 PM), make the last day minimal (breakfast, check-out, airport transfer)
5. Focus on FAMOUS LANDMARKS, ICONIC ATTRACTIONS, and BEAUTIFUL SCENIC SPOTS
6. Include cultural sites, museums, parks, viewpoints, and photogenic locations
7. Suggest budget and premium dining options with DETAILED descriptions
8. Add EXTENSIVE practical tips, historical context, and local insights
9. Make the plan flexible - things can be changed
10. Consider jet lag and travel fatigue
11. Schedule intensive sightseeing for full days, lighter activities for partial days
12. DO NOT include transportation details - focus only on destinations and attractions
13. Include HISTORICAL BACKGROUND and CULTURAL SIGNIFICANCE for each attraction
14. Provide DETAILED PHOTOGRAPHY TIPS and best photo spots
15. Include LOCAL CUSTOMS and ETIQUETTE information
16. Suggest SEASONAL ACTIVITIES and SPECIAL EVENTS
17. Provide DETAILED COST ESTIMATES for activities and meals
18. Include ACCESSIBILITY information where relevant
19. Suggest LOCAL TRANSPORTATION options between attractions
20. Provide DETAILED OPENING HOURS and TICKET INFORMATION

CRITICAL TIME ORGANIZATION RULES:
13. ALL activities within each day MUST be listed in CHRONOLOGICAL ORDER (earliest time first)
14. Use 24-hour format for all times (e.g., "09:00", "14:30", "19:00")
15. Start each day with the earliest activity and progress through the day sequentially
16. Do NOT mix up times - if you have 18:00 and 19:00 activities, 18:00 must come before 19:00
17. For arrival day: start with check-in, then evening activities
18. For departure day: start with morning activities, end with check-out
19. Ensure logical flow: breakfast → morning sightseeing → lunch → afternoon sightseeing → dinner → evening activities

Respond ONLY in JSON format, without additional text.
`;
}

// Функция для определения типа плана
function determinePlanType(tripInfo: any, cartItems: any[]): 'detailed' | 'recommendations' {
  console.log(' Determining plan type with:', {
    searchQuery: tripInfo.searchQuery, 
    totalDays: tripInfo.totalDays, 
    cartItemCount: cartItems.length 
  });

  // Проверяем, не является ли место назначения аэропортом
  const airportKeywords = ['airport', 'aeroport', 'terminal', 'cdg', 'international', 'charles de gaulle', 'charles de gaulle airport'];
  const destinationLower = tripInfo.destination?.toLowerCase() || '';
  
  console.log(' Checking destination for airport keywords:', {
    destination: tripInfo.destination,
    destinationLower,
    airportKeywords,
    hasAirportKeyword: airportKeywords.some(keyword => destinationLower.includes(keyword)),
    hasAirportCode: /[A-Z]{3,4}/.test(tripInfo.destination)
  });
  
  if (airportKeywords.some(keyword => destinationLower.includes(keyword)) ||
      /[A-Z]{3,4}/.test(tripInfo.destination)) {
    console.log(' Destination is an airport -> no plan needed');
    throw new Error('No trip plan needed for airport destinations');
  }

  // Проверяем детали рейса на наличие аэропорта
  const flightDetails = cartItems.find(item => item.type === 'flight')?.details;
  if (typeof flightDetails === 'string') {
    const parsedDetails = JSON.parse(flightDetails);
    if (parsedDetails.arrival?.airport || 
        (parsedDetails.arrival?.city && airportKeywords.some(keyword => 
          parsedDetails.arrival.city.toLowerCase().includes(keyword)))) {
      throw new Error('No trip plan needed for airport destinations');
    }
  }

  // Если корзина пустая, не создаем план
  if (!cartItems || cartItems.length === 0) {
    throw new Error('No items in cart to plan trip');
  }

  // Для всех остальных случаев создаем детальный план
  return 'detailed';
}

// Функция для создания промпта с рекомендациями
function createRecommendationsPrompt(tripInfo: any) {
  return `
You are a travel advisor. Create a comprehensive list of recommendations for ${tripInfo.destination} without any specific dates or schedule.

CREATE RECOMMENDATIONS IN THE FOLLOWING JSON FORMAT:
{
  "title": "Guide to ${tripInfo.destination}",
  "summary": "Essential recommendations for exploring ${tripInfo.destination}.",
  "sections": [
    {
      "title": "Must-See Landmarks",
      "description": "Iconic attractions and landmarks that define the city.",
      "items": [
        {
          "name": "Famous landmark name",
          "description": "Detailed description of its historical significance, architectural features, and what makes it special",
          "location": "Exact address and nearest transit stops",
          "tips": "Best time to visit, ticket prices, skip-the-line options, photography spots, guided tour recommendations"
        }
      ]
    },
    {
      "title": "Cultural Experiences",
      "description": "Immerse yourself in local culture and traditions.",
      "items": [
        {
          "name": "Museum/Theater/Cultural Center",
          "description": "What makes this place unique, special exhibitions, performances",
          "location": "Address and how to get there",
          "tips": "Ticket booking, special events, guided tours, local customs to be aware of"
        }
      ]
    },
    {
      "title": "Local Food Scene",
      "description": "Must-try local dishes and where to find them.",
      "items": [
        {
          "name": "Restaurant or food market name",
          "description": "Signature dishes, ambiance, price range, cuisine type",
          "location": "Address and neighborhood",
          "tips": "Reservation policy, peak hours, special recommendations, dress code"
        }
      ]
    },
    {
      "title": "Hidden Gems",
      "description": "Off-the-beaten-path spots locals love.",
      "items": [
        {
          "name": "Secret spot name",
          "description": "Why it's special, what to expect, best time to visit",
          "location": "How to find it",
          "tips": "Local insights, best photo spots, insider recommendations"
        }
      ]
    },
    {
      "title": "Shopping & Markets",
      "description": "Best places for shopping and local goods.",
      "items": [
        {
          "name": "Market or shopping area",
          "description": "What to buy, price ranges, specialties",
          "location": "Address and area",
          "tips": "Bargaining tips, best times to visit, quality checks"
        }
      ]
    },
    {
      "title": "Nature & Parks",
      "description": "Green spaces and natural attractions.",
      "items": [
        {
          "name": "Park or natural attraction",
          "description": "Features, activities available, scenic spots",
          "location": "How to get there",
          "tips": "Best times for visits, facilities available, activities"
        }
      ]
    }
  ],
  "practicalInfo": {
    "transportation": {
      "publicTransit": "Details about metro, bus, and train systems",
      "taxis": "Reliable taxi services and apps",
      "walking": "Walkable areas and pedestrian zones",
      "rentals": "Bike and car rental options"
    },
    "bestTimeToVisit": {
      "weather": "Seasonal weather patterns",
      "crowds": "Peak and off-peak times",
      "events": "Major annual events and festivals"
    },
    "localTips": {
      "customs": "Important local customs and etiquette",
      "safety": "Safety tips for different areas",
      "savings": "Money-saving tips and local deals"
    },
    "emergencyInfo": {
      "police": "Local police number",
      "ambulance": "Emergency medical services",
      "hospitals": ["List of major hospitals with English-speaking staff"],
      "pharmacies": "24-hour pharmacy locations",
      "tourist_police": "Tourist police contact"
    }
  }
}

IMPORTANT REQUIREMENTS:
1. Focus on timeless recommendations, not a time-specific itinerary.
2. Provide practical, actionable advice for a general visitor.
3. Include a mix of famous sites and local favorites.

Respond ONLY in JSON format, without additional text.
`;
}

// Функция для создания промпта с детальным планом
const createDetailedPlanPrompt = createTripPlanningPrompt;

// Функция для создания минимального валидного JSON
function createMinimalValidJson(jsonString: string): string {
  try {
    // Ищем начало JSON объекта
    const startIndex = jsonString.indexOf('{');
    if (startIndex === -1) {
      return '{"title": "Trip Plan", "summary": "Plan generated", "days": []}';
    }
    
    // Берем все до первого незакрытого объекта
    let braceCount = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < jsonString.length; i++) {
      if (jsonString[i] === '{') braceCount++;
      if (jsonString[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (braceCount > 0) {
      // Если объект не закрыт, закрываем его
      const partialJson = jsonString.substring(startIndex, endIndex + 1);
      return partialJson + '}';
    }
    
    return jsonString.substring(startIndex, endIndex + 1);
  } catch (error) {
    return '{"title": "Trip Plan", "summary": "Plan generated", "days": []}';
  }
}

// Функция для восстановления обрезанного JSON
function fixTruncatedJson(jsonString: string): string | null {
  try {
    // Подсчитываем открывающие и закрывающие скобки
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }
    }
    
    // Если JSON обрезан, пытаемся его восстановить
    if (openBraces > 0 || openBrackets > 0) {
      let fixedJson = jsonString;
      
      // Если JSON обрезан в середине строки, пытаемся найти последнюю завершенную структуру
      if (fixedJson.trim().endsWith(',')) {
        // Убираем последнюю запятую
        fixedJson = fixedJson.trim().slice(0, -1);
      }
      
      // Если JSON обрезан в середине строки, пытаемся найти последнюю завершенную структуру
      if (fixedJson.trim().endsWith('"')) {
        // Если строка обрезана в середине, закрываем ее
        fixedJson += '"';
      }
      
      // Закрываем незакрытые массивы
      for (let i = 0; i < openBrackets; i++) {
        fixedJson += ']';
      }
      
      // Закрываем незакрытые объекты
      for (let i = 0; i < openBraces; i++) {
        fixedJson += '}';
      }
      
      return fixedJson;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Функция для парсинга ответа от OpenRouter
function parseTripPlan(openrouterResponse: string) {
  try {
    console.log(' Parsing trip plan response, length:', openrouterResponse.length);
    console.log(' First 500 chars:', openrouterResponse.substring(0, 500));
    
    // Проверяем, что ответ не пустой
    if (!openrouterResponse || openrouterResponse.trim().length === 0) {
      console.log(' Empty response from OpenRouter');
      throw new Error('Empty response from OpenRouter');
    }
    
    // Очищаем ответ от комментариев
    let cleanResponse = openrouterResponse.replace(/\/\*[\s\S]*?\*\//g, '') // Многострочные комментарии
                                       .replace(/\/\/.*/g, '') // Однострочные комментарии
                                       .replace(/^\s*[\r\n]/gm, ''); // Пустые строки
    
    // Пытаемся найти JSON в ответе - ищем несколько возможных паттернов
    const jsonPatterns = [
      /```json\s*(\{[\s\S]*?\})\s*```/i,  // JSON в markdown блоке
      /```\s*(\{[\s\S]*?\})\s*```/i,  // JSON в блоке кода
      /\{[\s\S]*\}/,  // Базовый JSON
    ];
    
    let jsonString = null;
    for (const pattern of jsonPatterns) {
      const match = cleanResponse.match(pattern);
      if (match) {
        jsonString = match[1] || match[0];
        break;
      }
    }
    
    if (!jsonString) {
      throw new Error('No JSON found in response');
    }
    
    // Парсим JSON
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
      return parsed;
    } catch (parseError) {
      // Пытаемся восстановить обрезанный JSON
      const fixedJson = fixTruncatedJson(jsonString);
      if (fixedJson) {
        try {
          parsed = JSON.parse(fixedJson);
          return parsed;
        } catch (secondError) {
          // Если восстановление не помогло, пытаемся создать минимальный валидный JSON
          try {
            const minimalJson = createMinimalValidJson(jsonString);
            parsed = JSON.parse(minimalJson);
            return parsed;
          } catch (thirdError) {
            throw parseError; // Выбрасываем оригинальную ошибку
          }
        }
      } else {
        throw parseError; // Выбрасываем оригинальную ошибку
      }
    }
    
  } catch (error) {
    console.error(' Error parsing OpenRouter response:', error);
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
