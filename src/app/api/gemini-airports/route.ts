import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_GEMINI_API_KEY = process.env.OPENROUTER_GEMINI_API_KEY || '';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  isMain?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { city } = await request.json();

    if (!city || typeof city !== 'string') {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }

    const prompt = `Для города "${city}" верни список аэропортов в формате JSON. 

Требования:
1. Верни только валидные IATA коды аэропортов (3 буквы)
2. Включи основные аэропорты города и пригорода (если используются)
3. Для каждого аэропорта укажи: code, name, city, country, isMain
4. isMain = true только для главного/основного аэропорта города (должен быть максимум 1 такой аэропорт)
5. Верни минимум 2-3 аэропорта для больших городов

Пример ответа:
{
  "airports": [
    {
      "code": "JFK",
      "name": "John F. Kennedy International Airport",
      "city": "New York",
      "country": "USA",
      "isMain": true
    },
    {
      "code": "LGA", 
      "name": "LaGuardia Airport",
      "city": "New York",
      "country": "USA",
      "isMain": false
    }
  ]
}

Город: ${city}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from OpenRouter API');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from Gemini');
    }

    // Пытаемся извлечь JSON из ответа
    let airports: Airport[] = [];
    try {
      // Ищем JSON в ответе
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        airports = parsed.airports || [];
      } else {
        // Если JSON не найден, пытаемся создать базовый ответ
        airports = [
          {
            code: city.substring(0, 3).toUpperCase(),
            name: `${city} Airport`,
            city: city,
            country: 'Unknown'
          }
        ];
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback: создаем базовый аэропорт
      airports = [
        {
          code: city.substring(0, 3).toUpperCase(),
          name: `${city} Airport`,
          city: city,
          country: 'Unknown'
        }
      ];
    }

    // Валидация и очистка данных
    let validAirports = airports
      .filter((airport: Airport) => 
        airport.code && 
        airport.code.length === 3 && 
        /^[A-Z]{3}$/.test(airport.code)
      )
      .map((airport: Airport) => ({
        code: airport.code.toUpperCase(),
        name: airport.name || `${airport.code} Airport`,
        city: airport.city || city,
        country: airport.country || 'Unknown',
        isMain: airport.isMain === true
      }));

    // Если нет пометки isMain=true ни у одного, назначим главный аэропорт первому в списке
    if (validAirports.length > 0 && !validAirports.some(a => a.isMain)) {
      validAirports = validAirports.map((a, idx) => ({ ...a, isMain: idx === 0 }));
    }

    return NextResponse.json({
      airports: validAirports,
      city: city,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Error in gemini-airports API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch airports from Gemini',
        airports: [],
        city: 'unknown'
      },
      { status: 500 }
    );
  }
}
