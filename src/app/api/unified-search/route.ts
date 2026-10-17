import { NextRequest, NextResponse } from 'next/server';
import { searchWithSerpAPI } from '@/lib/openrouter';
import { searchFlights } from '@/lib/flight-search';
import { searchRestaurants, searchCarRentals, searchTaxiServices } from '@/lib/openrouter';

// Use the same API key as in other parts of the application
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Simple patterns for extracting cities
const cityPatterns = [
  // "from Moscow to Istanbul"
  { regex: /from\s+([a-z]+(?:\s+[a-z]+)*)\s+to\s+([a-z]+(?:\s+[a-z]+)*)/i, from: 1, to: 2 },
  // "Moscow to Istanbul"
  { regex: /([a-z]+(?:\s+[a-z]+)*)\s+to\s+([a-z]+(?:\s+[a-z]+)*)/i, from: 1, to: 2 },
  // "Moscow - Istanbul"
  { regex: /([a-z]+(?:\s+[a-z]+)*)\s*[-–]\s*([a-z]+(?:\s+[a-z]+)*)/i, from: 1, to: 2 },
  // "Moscow Istanbul" (without preposition)
  { regex: /([a-z]+(?:\s+[a-z]+)*)\s+([a-z]+(?:\s+[a-z]+)*)/i, from: 1, to: 2 }
];

// Helper function to extract cities from query
function extractCitiesFromQuery(query: string): { from: string | null; to: string | null } {
  const queryLower = query.toLowerCase();
  
  // Простые паттерны для извлечения городов
  const patterns = [
    // "из Москвы в Стамбул"
    { regex: /из\s+([а-яёa-z]+(?:\s+[а-яёa-z]+)*)\s+в\s+([а-яёa-z]+(?:\s+[а-яёa-z]+)*)/i, from: 1, to: 2 },
    // "Москва - Стамбул"
    { regex: /([а-яёa-z]+(?:\s+[а-яёa-z]+)*)\s*[-–]\s*([а-яёa-z]+(?:\s+[а-яёa-z]+)*)/i, from: 1, to: 2 },
    // "в Стамбул" (только пункт назначения)
    { regex: /в\s+([а-яёa-z]+(?:\s+[а-яёa-z]+)*)/i, from: null, to: 1 },
    // "из Москвы" (только пункт отправления)
    { regex: /из\s+([а-яёa-z]+(?:\s+[а-яёa-z]+)*)/i, from: 1, to: null }
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern.regex);
    if (match) {
      const from = pattern.from ? match[pattern.from].trim() : null;
      const to = pattern.to ? match[pattern.to].trim() : null;
      
      // Преобразуем русские названия в английские
      const fromCity = from ? translateCityName(from) : null;
      const toCity = to ? translateCityName(to) : null;
      
      return { from: fromCity, to: toCity };
    }
  }
  
  return { from: null, to: null };
}



// Helper function to get day name
function getDayName(dayNumber: number): string {
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  return days[dayNumber];
}

// Helper function to check if round trip is requested
function isRoundTripRequested(query: string): boolean {
  const roundTripKeywords = [
    'обратно', 'возврат', 'туда-обратно', 'туда и обратно', 'round trip', 'return',
    'в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу',
    'в следующее воскресенье', 'в следующий понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'
  ];
  
  const lowerQuery = query.toLowerCase();
  return roundTripKeywords.some(keyword => lowerQuery.includes(keyword));
}

interface DateInfo {
  date: string;
  isSpecificDay: boolean;
  returnDate?: string | null;
}





// Helper function to get month number from Russian month name
function getMonthNumber(monthName: string): number | undefined {
  const months: Record<string, number> = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };
  return months[monthName.toLowerCase()];
}

// Helper function to validate and fix dates
async function validateAndFixDate(dateString: string, originalQuery: string): Promise<string> {
  const dates = await extractDatesFromQuery(originalQuery);
  
  // Если в запросе была указана дата, используем её
  if (dates.departureDate) {
    console.log(` Using specifically requested date: ${dates.departureDate}`);
    return dates.departureDate;
  }

  // Иначе проверяем, не в прошлом ли дата
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    console.log(' Date is in the past, using tomorrow instead');
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  return dateString;
}

// Helper function to translate city names
function translateCityName(cityName: string): string {
  // Если город уже на английском, возвращаем как есть
  if (/^[A-Za-z\s-]+$/.test(cityName)) {
    // Приводим к правильному регистру (каждое слово с большой буквы)
    return cityName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  // Приводим к нижнему регистру для поиска
  const cityLower = cityName.toLowerCase();
  
  const cityMap: { [key: string]: string } = {
    'москва': 'Moscow',
    'мск': 'Moscow',
    'питер': 'Saint Petersburg',
    'санкт-петербург': 'Saint Petersburg',
    'спб': 'Saint Petersburg',
    'стамбул': 'Istanbul',
    'истанбул': 'Istanbul',
    'нью-йорк': 'New York',
    'ньюйорк': 'New York',
    'нью йорк': 'New York',
    'париж': 'Paris',
    'лондон': 'London',
    'берлин': 'Berlin',
    'рим': 'Rome',
    'мадрид': 'Madrid',
    'барселона': 'Barcelona',
    'токио': 'Tokyo',
    'пекин': 'Beijing',
    'шанхай': 'Shanghai',
    'сингапур': 'Singapore',
    'дубай': 'Dubai',
    'дубаи': 'Dubai',
    'анталия': 'Antalya',
    'анталья': 'Antalya',
    'сочи': 'Sochi',
    'казань': 'Kazan',
    'новосибирск': 'Novosibirsk',
    'екатеринбург': 'Yekaterinburg',
    'владивосток': 'Vladivostok',
    'калининград': 'Kaliningrad',
    'тель-авив': 'Tel Aviv',
    'тель авив': 'Tel Aviv',
    'тельавив': 'Tel Aviv',
    'тбилиси': 'Tbilisi',
    'ереван': 'Yerevan',
    'баку': 'Baku',
    'минск': 'Minsk',
    'киев': 'Kyiv',
    'астана': 'Astana',
    'алматы': 'Almaty',
    'ташкент': 'Tashkent'
  };

  // Возвращаем перевод или оригинальное название с правильным регистром
  return cityMap[cityLower] || cityName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}



async function analyzeQueryWithLLM(query: string) {
  console.log(' Analyzing query with Gemini:', query);

  try {
    // Форматируем текущую дату
    const today = new Date();
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getDayName = (dayIndex: number) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[dayIndex];
    };

    const todayFormatted = formatDate(today);
    const todayName = getDayName(today.getDay());

    // Проверяем, запросил ли пользователь билет туда-обратно
    const wantsRoundTrip = isRoundTripRequested(query);
    console.log(' Round-trip requested:', wantsRoundTrip);

    // Создаем промпт для AI с улучшенной логикой определения дат
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.5-pro",
        "messages": [
          {
            "role": "system",
            "content": `You are a travel planning assistant. Your task is to analyze travel queries and extract structured information.

            Current date: ${todayFormatted} (${todayName})

            Date Extraction Rules:
            1. If a weekday is mentioned (e.g., "в четверг", "в субботу"):
               - If the day is later this week, use that date
               - If the day is earlier this week or today, use next week's date
               - For return dates, always ensure they are after the departure date
            
            2. For relative dates:
               - "завтра" = next day after today
               - "послезавтра" = day after tomorrow
               - "через X дней" = today + X days
               - "следующий [день]" = next occurrence of that day
            
            3. Return dates:
               - Must always be after departure date
               - If return date would be before or same as departure, move it to next week
               - For one-way flights, return date should be null
            
            Examples (assuming today is ${todayFormatted}, ${todayName}):
            - "в четверг" → next Thursday after today
            - "в субботу" → next Saturday after today
            - "завтра" → ${formatDate(new Date(today.getTime() + 24*60*60*1000))}
            - "послезавтра" → ${formatDate(new Date(today.getTime() + 2*24*60*60*1000))}
            
            Always return dates in YYYY-MM-DD format.

            Date Extraction Rules:
            1. For departure date:
               - "в субботу" → find next Saturday
               - "в следующий понедельник" → find next Monday
               - "через X дней" → current_date + X days
               - "завтра" → tomorrow
               - Always return YYYY-MM-DD format
               - Never return null for dates mentioned in query
            
            2. For return date:
               - "обратно в воскресенье" → find next Sunday after departure
               - "вернуться через X дней" → departure_date + X days
               - "в следующую пятницу обратно" → find next Friday
               - Always return YYYY-MM-DD format
               - Return null only if no return date mentioned
            
            Budget Extraction Rules:
            1. For hotels:
               - "budget X per day" → maxPrice = X
               - "X dollars per night" → maxPrice = X
               - "hotel budget X" → maxPrice = X
               - "up to X for hotel" → maxPrice = X
               - Always extract numeric value only
               - Remove currency symbols and convert to number
               - If budget mentioned without specifying "per night" or "per day", assume it's per night
            
            2. For flights:
               - "flight budget X" → maxPrice = X
               - "up to X for flight" → maxPrice = X
               - "ticket under X" → maxPrice = X
               - Always extract numeric value only
               - Remove currency symbols and convert to number
            
            Service Rules:
            1. Car rental is needed if:
               - Query mentions "аренда машины", "арендовать машину", "взять машину", "rent a car"
               - Query mentions "нужна машина", "need a car"
               - Query mentions "передвигаться на машине", "drive around"
            
            2. Taxi service is needed if:
               - Query mentions "такси", "taxi"
               - Query mentions "трансфер", "transfer"
               - Query mentions "заказать машину", "order a car"
               - Query mentions "вызвать машину", "call a car"

            3. Restaurant search is needed if:
               - Query mentions "ресторан", "restaurant", "кафе", "cafe"
               - Query mentions "поесть", "eat", "пообедать", "lunch", "ужин", "dinner"
               - Query mentions "бизнес встреча", "деловой обед", "business meeting"
               - Query mentions "забронировать столик", "reserve table"
               - Query mentions "где поесть", "where to eat"

            Allergy Detection Rules:
            1. Common allergies to detect:
               - "аллергия на морепродукты" / "seafood allergy" → exclude seafood restaurants
               - "аллергия на орехи" / "nut allergy" → exclude restaurants with nuts
               - "аллергия на глютен" / "gluten allergy" / "целиакия" → exclude gluten-containing foods
               - "аллергия на молоко" / "lactose intolerance" / "непереносимость лактозы" → exclude dairy
               - "аллергия на яйца" / "egg allergy" → exclude egg-containing foods
               - "вегетарианец" / "vegetarian" → exclude meat restaurants
               - "веган" / "vegan" → exclude animal products
               - "аллергия на сою" / "soy allergy" → exclude soy products
               - "аллергия на рыбу" / "fish allergy" → exclude fish restaurants
               - "аллергия на моллюски" / "shellfish allergy" → exclude shellfish

            Return a structured JSON with:
            {
  "hotel": {
                "location": "city name in English",
                "maxPrice": number (extracted from budget constraints, REQUIRED),
                "checkIn": "YYYY-MM-DD",
                "checkOut": "YYYY-MM-DD",
                "stars": "number of stars if specified",
                "amenities": ["list", "of", "required", "amenities"]
              },
              "flights": [{
                "from": "departure city in English",
                "to": "arrival city in English",
                "date": "YYYY-MM-DD (calculated based on date rules)",
                "returnDate": "YYYY-MM-DD or null (calculated based on date rules)",
                "class": "economy/business/first",
                "maxPrice": number (if specified)
              }],
              "dates": {
                "explanation": "Explain how you calculated the dates",
                "today": "${todayFormatted}",
                "departureDate": "YYYY-MM-DD (calculated based on date rules)",
                "returnDate": "YYYY-MM-DD or null (calculated based on date rules)",
                "departureDayName": "Name of departure day (e.g., Thursday)",
                "returnDayName": "Name of return day (e.g., Sunday) or null"
              },
              "services": {
                "needCarRental": boolean (based on Service Rules),
                "needTaxi": boolean (based on Service Rules),
                "needRestaurants": boolean (based on Service Rules),
                "explanation": "Explain which services are needed and why"
              },
              "dietaryRestrictions": {
                "allergies": ["list", "of", "detected", "allergies"],
                "dietaryPreferences": ["vegetarian", "vegan", "etc"],
                "excludeKeywords": ["keywords", "to", "exclude", "from", "restaurant", "search"],
                "explanation": "Explain detected dietary restrictions"
  }
}`
          },
          {
            "role": "user",
            "content": query
          }
        ],
        "temperature": 0.2,
        "max_tokens": 3000
      })
    });

    if (!response.ok) {
      console.error('LLM API Error:', response.status, response.statusText);
      throw new Error('Failed to analyze query with LLM.');
    }

    const data = await response.json();
    console.log(' Gemini response:', data);
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Gemini response');
    }

    console.log(' Gemini content:', content);
    
    // Пытаемся распарсить JSON из ответа Gemini
    try {
      // Убираем markdown обрамление, если оно есть
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log(' Cleaned content:', cleanContent);
      
      const structuredResult = JSON.parse(cleanContent);
      console.log(' Parsed structured result:', structuredResult);
      
      // Принудительно убираем returnDate, если не был запрошен билет туда-обратно
      if (!wantsRoundTrip && structuredResult.flights) {
        structuredResult.flights.forEach((flight: any) => {
          flight.returnDate = null;
          console.log(' Forced one-way flight, removed returnDate');
        });
      }
      
      // Проверяем и исправляем даты в результатах AI
      if (structuredResult.flights && Array.isArray(structuredResult.flights)) {
        // Используем даты, рассчитанные AI
        const dates = structuredResult.dates || {
          departureDate: null,
          returnDate: null,
          explanation: "No dates provided by AI"
        };

        console.log(' AI date calculation:', dates.explanation);
        console.log(' AI suggested dates:', {
          departure: dates.departureDate,
          departureDayName: dates.departureDayName,
          return: dates.returnDate,
          returnDayName: dates.returnDayName
        });

        // Если AI не смог определить даты, используем завтрашний день для вылета
        if (!dates.departureDate) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dates.departureDate = tomorrow.toISOString().split('T')[0];
          console.log(' AI failed to determine date, using tomorrow:', dates.departureDate);
        }

        // Если это билет туда-обратно и дата возврата не указана, используем следующий день после вылета
        const wantsRoundTrip = isRoundTripRequested(query);
        if (wantsRoundTrip && !dates.returnDate && dates.departureDate) {
          const returnDate = new Date(dates.departureDate);
          returnDate.setDate(returnDate.getDate() + 1);
          dates.returnDate = returnDate.toISOString().split('T')[0];
          console.log(' No return date provided by AI, using next day:', dates.returnDate);
        }

        console.log(' Final flight dates:', {
          departure: dates.departureDate,
          return: dates.returnDate,
          isRoundTrip: wantsRoundTrip
        });

        structuredResult.flights.forEach((flight: any, index: number) => {
          // Переводим города на английский
          if (flight.from) {
            const originalFrom = flight.from;
            flight.from = translateCityName(flight.from);
            if (originalFrom !== flight.from) {
              console.log(` Translated city from "${originalFrom}" to "${flight.from}"`);
            }
          }
          if (flight.to) {
            const originalTo = flight.to;
            flight.to = translateCityName(flight.to);
            if (originalTo !== flight.to) {
              console.log(` Translated city from "${originalTo}" to "${flight.to}"`);
            }
          }

          // Используем даты, рассчитанные AI
            const originalDate = flight.date;
          flight.date = dates.departureDate;
          console.log(` Using AI departure date: ${flight.date} (was: ${originalDate})`);

          if (wantsRoundTrip) {
            const originalReturnDate = flight.returnDate;
            flight.returnDate = dates.returnDate;
            console.log(` Using AI return date: ${flight.returnDate} (was: ${originalReturnDate})`);
          } else {
            flight.returnDate = null;
            console.log(' One-way flight, setting return date to null');
          }
        });
      }

      // Также переводим города для отелей
      if (structuredResult.hotel?.location) {
        const originalLocation = structuredResult.hotel.location;
        structuredResult.hotel.location = translateCityName(structuredResult.hotel.location);
        if (originalLocation !== structuredResult.hotel.location) {
          console.log(` Translated hotel location from "${originalLocation}" to "${structuredResult.hotel.location}"`);
        }
      }
      
      // Проверяем, что получили хотя бы какую-то информацию
      if (!structuredResult.hotel && !structuredResult.flights && !structuredResult.carRental) {
        console.log(' No structured data found, creating fallback response');
        return createFallbackResponse(query);
      }
      
      return structuredResult;
    } catch (parseError) {
      console.error(' Failed to parse Gemini response as JSON:', parseError);
      console.log(' Raw content that failed to parse:', content);
      
      // Fallback: создаем структурированный ответ на основе простого анализа
      return createFallbackResponse(query);
    }

  } catch (error) {
    console.error('Error in analyzeQueryWithLLM:', error);
    throw error;
  }
}

// Функция для создания fallback ответа, когда Gemini не может структурировать данные
async function createFallbackResponse(query: string) {
  console.log(' Creating fallback response for query:', query);
  
  const lowerQuery = query.toLowerCase();
  const cities = extractCitiesFromQuery(query);
  const dates = await extractDatesFromQuery(query);
  const wantsRoundTrip = isRoundTripRequested(query);
  
  console.log(' Fallback response parameters:', {
    cities,
    dates,
    wantsRoundTrip
  });
  
  // Создаем базовую структуру ответа
  const response: any = {
    passengers: 1,
    flights: [],
    hotel: null,
    carRental: {
      needed: false,
      pickup: null,
      dropoff: null,
      type: null
    },
    dietaryNeeds: {
      person: null,
      restriction: null
    },
    dietaryRestrictions: {
      allergies: [],
      dietaryPreferences: [],
      excludeKeywords: [],
      explanation: null
    }
  };

  // Если нашли города, добавляем информацию о рейсе
  if (cities.from || cities.to) {
    response.flights.push({
      from: cities.from || 'Miami',
      to: cities.to || 'New York',
      date: dates.departureDate,
      returnDate: dates.returnDate,
      class: 'economy',
      maxPrice: null
    });
  }

  // Если упоминается отель, добавляем его
  if (lowerQuery.includes('отел') || lowerQuery.includes('hotel')) {
    response.hotel = {
      location: cities.to || cities.from,
      stars: null,
      budget: null,
      amenities: [],
      preferences: []
    };
  }

  return response;
}

// Helper function to extract dates from query

async function extractDatesFromQuery(query: string): Promise<{ departureDate: string | null; returnDate: string | null }> {
  const today = new Date();
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const todayFormatted = formatDate(today);
  const todayName = getDayName(today.getDay());

  try {
    // Создаем промпт для AI с контекстом о текущей дате и запрошенном дне
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a travel planning assistant. Your task is to extract departure and return dates from a travel query.

            Current date: ${todayFormatted} (${todayName})

            Date Extraction Rules:
            1. If a weekday is mentioned (e.g., "в четверг", "в субботу"):
               - If the day is later this week, use that date
               - If the day is earlier this week or today, use next week's date
               - For return dates, always ensure they are after the departure date
            
            2. For relative dates:
               - "завтра" = next day after today
               - "послезавтра" = day after tomorrow
               - "через X дней" = today + X days
               - "следующий [день]" = next occurrence of that day
            
            3. Return dates:
               - Must always be after departure date
               - If return date would be before or same as departure, move it to next week
               - For one-way flights, return date should be null
            
            Examples (assuming today is ${todayFormatted}, ${todayName}):
            - "в четверг" → next Thursday after today
            - "в субботу" → next Saturday after today
            - "завтра" → ${formatDate(new Date(today.getTime() + 24*60*60*1000))}
            - "послезавтра" → ${formatDate(new Date(today.getTime() + 2*24*60*60*1000))}
            
            Return ONLY a JSON object with:
            {
              "departureDate": "YYYY-MM-DD",
              "returnDate": "YYYY-MM-DD" or null,
              "explanation": "Explain how you calculated these dates"
            }`
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    try {
      // Убираем markdown обрамление, если оно есть
      let cleanContent = content;
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const result = JSON.parse(cleanContent);
      
      // Проверяем формат дат
      if (result.departureDate && !/^\d{4}-\d{2}-\d{2}$/.test(result.departureDate)) {
        throw new Error(`Invalid departure date format: ${result.departureDate}`);
      }
      if (result.returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(result.returnDate)) {
        throw new Error(`Invalid return date format: ${result.returnDate}`);
      }

      console.log(' AI date calculation:', result.explanation);
      console.log(' AI suggested dates:', {
        departure: result.departureDate,
        return: result.returnDate
      });

      return {
        departureDate: result.departureDate || null,
        returnDate: result.returnDate || null
      };
    } catch (parseError) {
      console.error(' Failed to parse AI response:', parseError);
      console.log(' Raw content that failed to parse:', content);
      return { departureDate: null, returnDate: null };
    }
  } catch (error) {
    console.error(' Error getting dates from AI:', error);
    return { departureDate: null, returnDate: null };
  }
}

// Вспомогательные функции для извлечения информации
function extractLocation(query: string): string {
  const match = query.match(/в\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)*)/);
  return match ? match[1].trim() : 'Указанное место';
}

function extractStars(query: string): string {
  if (query.includes('5 звезд') || query.includes('5 star')) return '5';
  if (query.includes('4 звезд') || query.includes('4 star')) return '4';
  if (query.includes('3 звезд') || query.includes('3 star')) return '3';
  if (query.includes('2 звезд') || query.includes('2 star')) return '2';
  if (query.includes('1 звезд') || query.includes('1 star')) return '1';
  return '3-4';
}

function extractBudget(query: string): string {
  const match = query.match(/(\d+)\s*\$|\$\s*(\d+)/);
  if (match) {
    const amount = match[1] || match[2];
    return `$${amount}/day`;
  }
  return 'Бюджет не указан';
}

function extractAmenities(query: string): string[] {
  const amenities = [];
  if (query.includes('завтрак') || query.includes('breakfast')) amenities.push('Завтрак');
  if (query.includes('wifi') || query.includes('wi-fi')) amenities.push('WiFi');
  if (query.includes('парковка') || query.includes('parking')) amenities.push('Парковка');
  if (query.includes('бассейн') || query.includes('pool')) amenities.push('Бассейн');
  return amenities.length > 0 ? amenities : ['Базовые удобства'];
}

function extractPreferences(query: string): string {
  if (query.includes('новый') || query.includes('свежий')) return 'Новый/свежий отель';
  if (query.includes('центр') || query.includes('center')) return 'В центре города';
  if (query.includes('тихий') || query.includes('quiet')) return 'Тихий район';
  return 'Стандартные требования';
}

function extractFrom(query: string): string {
  const match = query.match(/из\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)*)/);
  return match ? match[1].trim() : 'Город отправления';
}

function extractTo(query: string): string {
  const match = query.match(/в\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)*)/);
  return match ? match[1].trim() : 'Город назначения';
}

function extractDate(query: string): string {
  if (query.includes('сегодня')) return 'Сегодня';
  if (query.includes('завтра')) return 'Завтра';
  if (query.includes('суббота') || query.includes('saturday')) return 'Суббота';
  if (query.includes('воскресенье') || query.includes('sunday')) return 'Воскресенье';
  return 'Дата не указана';
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    console.log(' Unified search request:', query);

    const structuredQuery = await analyzeQueryWithLLM(query);
    console.log(' LLM analysis result:', structuredQuery);
    
    const results = {
      summary: structuredQuery,
      hotels: [] as any[],
      flights: [] as any[],
      restaurants: [] as any[],
      carRentals: [] as any[],
      taxiServices: [] as any[]
    };

    const promises = [];

    // Поиск отелей
    if (structuredQuery.hotel?.location) {
      console.log(' Starting hotel search for location:', structuredQuery.hotel.location);
      promises.push(
        searchWithSerpAPI(structuredQuery.hotel.location, structuredQuery.hotel).then((hotelData: any) => {
          console.log(' Hotel search completed:', hotelData);
          if (hotelData?.type === 'hotels') { 
            results.hotels = hotelData.data;
            console.log(' Hotels added to results:', hotelData.data.length);
          }
        }).catch((e: any) => console.error(" Hotel search failed:", e))
      );
    }

    // Поиск ресторанов только если они запрошены
    const searchLocationForRestaurants = structuredQuery.hotel?.location || 
                                       (structuredQuery.flights?.[0]?.to) || 
                                       null;
    
    if (searchLocationForRestaurants && structuredQuery.services?.needRestaurants) {
      console.log(' Restaurant search requested:', structuredQuery.services.explanation);
      
      let restaurantQuery = `restaurants in ${searchLocationForRestaurants}`;
      
      // Обрабатываем диетические ограничения и аллергии
      const dietaryRestrictions = structuredQuery.dietaryRestrictions;
      if (dietaryRestrictions) {
        console.log(' Dietary restrictions detected:', dietaryRestrictions.explanation);
        
                 // Добавляем исключающие ключевые слова в поиск
         if (dietaryRestrictions.excludeKeywords && dietaryRestrictions.excludeKeywords.length > 0) {
           const excludeTerms = dietaryRestrictions.excludeKeywords.map((keyword: string) => `-${keyword}`).join(' ');
           restaurantQuery += ` ${excludeTerms}`;
           console.log(' Excluding from search:', dietaryRestrictions.excludeKeywords);
         }
        
        // Добавляем предпочтения в поиск
        if (dietaryRestrictions.dietaryPreferences && dietaryRestrictions.dietaryPreferences.length > 0) {
          const preferenceTerms = dietaryRestrictions.dietaryPreferences.join(' ');
          restaurantQuery += ` ${preferenceTerms}`;
          console.log(' Including preferences:', dietaryRestrictions.dietaryPreferences);
        }
      }
      
      // Обратная совместимость со старым форматом
      const restriction = structuredQuery.dietaryNeeds?.restriction?.toLowerCase();
      if (restriction && !dietaryRestrictions) {
        console.log(` Legacy dietary restriction found: "${restriction}"`);
        if (restriction.includes('морепродукт') || restriction.includes('seafood')) {
          restaurantQuery += ' -seafood -shellfish -"морепродукты"';
          console.log(' Excluding seafood from restaurant search.');
        } else {
          restaurantQuery += ` with options for "${structuredQuery.dietaryNeeds.restriction}"`;
        }
      }

      console.log(' Starting restaurant search with final query:', restaurantQuery);
      promises.push(
        searchRestaurants(restaurantQuery).then((restaurantData: any) => {
          console.log(' Restaurant search completed:', restaurantData);
          if (restaurantData?.type === 'restaurants') {
            results.restaurants = restaurantData.data;
            console.log(' Restaurants added to results:', restaurantData.data.length);
          }
        }).catch((e: any) => console.error(" Restaurant search failed:", e))
      );
    } else {
      console.log(' Restaurant search not requested');
    }

    // Поиск аренды машин и такси только если они запрошены
    const searchLocation = structuredQuery.hotel?.location || 
                         (structuredQuery.flights?.[0]?.to) || 
                         null;
    
    if (searchLocation && structuredQuery.services) {
      // Поиск аренды машин
      if (structuredQuery.services.needCarRental) {
      console.log(' Starting car rental search for location:', searchLocation);
        console.log(' Reason:', structuredQuery.services.explanation);
      promises.push(
        searchCarRentals(searchLocation, query).then((carData: any) => {
          console.log(' Car rental search completed:', carData);
          if (carData?.type === 'car_rentals') {
            results.carRentals = carData.data;
            console.log(' Car rentals added to results:', carData.data.length);
          }
        }).catch((e: any) => console.error(" Car rental search failed:", e))
      );
      } else {
        console.log(' Car rental not requested');
      }

      // Поиск такси
      if (structuredQuery.services.needTaxi) {
        console.log(' Starting taxi search for location:', searchLocation);
        console.log(' Reason:', structuredQuery.services.explanation);
        promises.push(
          searchTaxiServices(searchLocation, query).then((taxiData: any) => {
            console.log(' Taxi search completed:', taxiData);
            if (taxiData?.type === 'taxi_services') {
              results.taxiServices = taxiData.data;
              console.log(' Taxi services added to results:', taxiData.data.length);
            }
          }).catch((e: any) => console.error(" Taxi search failed:", e))
        );
      } else {
        console.log(' Taxi service not requested by AI, but adding anyway for user convenience');
        // Добавляем поиск такси даже если AI не определил их как необходимые
        promises.push(
          searchTaxiServices(searchLocation, query).then((taxiData: any) => {
            console.log(' Taxi search completed:', taxiData);
            if (taxiData?.type === 'taxi_services') {
              results.taxiServices = taxiData.data;
              console.log(' Taxi services added to results:', taxiData.data.length);
            }
          }).catch((e: any) => console.error(" Taxi search failed:", e))
        );
      }
    }

    // Поиск рейсов
    if (structuredQuery.flights && structuredQuery.flights.length > 0) {
      const flight = structuredQuery.flights[0];
      console.log(' Starting flight search:', flight);
      // console.log(' Destination city for weather:', flight.to); // Weather temporarily disabled
      // console.log(' Travel date for weather:', flight.date); // Weather temporarily disabled
      
      if (flight.from && flight.to) {
        // Получаем даты напрямую из запроса
        const dates = await extractDatesFromQuery(query);
        console.log(' Extracted dates for flight search:', dates);

        // Используем извлеченные даты или даты из AI
        const departureDate = dates.departureDate || await validateAndFixDate(flight.date || '', query);
        const returnDate = dates.returnDate || (flight.returnDate ? await validateAndFixDate(flight.returnDate, query) : null);
        
        // Для односторонних рейсов returnDate должен быть null
        const isOneWay = !returnDate;
        
        console.log(' Flight search parameters:', {
          from: flight.from,
          to: flight.to,
          date: departureDate,
          returnDate: returnDate,
          isOneWay: isOneWay,
          passengers: structuredQuery.passengers || 1
        });
        
        promises.push(
          searchFlights(
            flight.from,
            flight.to,
            departureDate,
            returnDate,
            isOneWay,
            'ECONOMY',
            structuredQuery.passengers || 1
          ).then((flightData: any) => {
            console.log(' Flight search completed:', flightData);
            if (flightData?.type === 'flights') {
              results.flights = flightData.data;
              console.log(' Flights added to results:', flightData.data.length);
            } else if (flightData?.type === 'text') {
              console.log(' Flight search returned text instead of flights:', flightData.data);
            }
          }).catch((e: any) => console.error(" Flight search failed:", e))
        );
      } else {
        console.log(' Missing required flight parameters:', { from: flight.from, to: flight.to, date: flight.date });
      }
    }

    // Ждем завершения всех поисковых запросов
    await Promise.all(promises);
    console.log(' All searches completed');
    console.log(' Final results:', {
      hotels: results.hotels.length,
      flights: results.flights.length,
      restaurants: results.restaurants.length,
      carRentals: results.carRentals.length,
      taxiServices: results.taxiServices.length
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error(' API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

