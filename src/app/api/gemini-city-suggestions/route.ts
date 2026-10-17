import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_GEMINI_API_KEY = process.env.OPENROUTER_GEMINI_API_KEY || '';

interface CitySuggestion {
  name: string;
  country: string;
  type: 'city' | 'airport' | 'region';
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query parameter is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    const prompt = `Пользователь вводит: "${query}". Верни список подходящих городов с аэропортами в формате JSON.

ВАЖНО: Верни ТОЛЬКО города, где есть реальные международные аэропорты с регулярными рейсами.

           Требования:
           1. Верни 5-8 наиболее релевантных вариантов
           2. Включи только крупные города с действующими аэропортами
           3. Для каждого варианта укажи: name, country, type, description
           4. type ВСЕГДА должен быть "city" (город)
           5. description - краткое описание с упоминанием аэропорта (например, "Столица Германии с аэропортом BER", "Крупный город в Испании с аэропортом BCN")
           6. Сортировка по релевантности и популярности
           7. НЕ включай города без аэропортов, деревни, регионы
           8. Фокус на городах с международными аэропортами
           9. НЕ включай дублирующиеся города
           10. Если не можешь найти подходящие города, верни пустой массив suggestions: []

Пример ответа:
{
  "suggestions": [
    {
      "name": "Berlin",
      "country": "Germany",
      "type": "city",
      "description": "Столица Германии с аэропортами BER, TXL, SXF"
    },
    {
      "name": "Barcelona",
      "country": "Spain", 
      "type": "city",
      "description": "Крупный город в Испании с аэропортом BCN"
    }
  ]
}

Запрос пользователя: "${query}"`;

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
        max_tokens: 800,
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
    let suggestions: CitySuggestion[] = [];
    try {
      // Ищем JSON в ответе
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      } else {
        // Если JSON не найден, возвращаем пустой список
        suggestions = [];
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // При ошибке парсинга возвращаем пустой список
      suggestions = [];
    }

    // Валидация и очистка данных
    const validSuggestions = suggestions
      .filter((suggestion: CitySuggestion) => 
        suggestion.name && 
        suggestion.name.length > 0 &&
        suggestion.country &&
        suggestion.type === 'city' // Только города
      )
      .map((suggestion: CitySuggestion) => ({
        name: suggestion.name.trim(),
        country: suggestion.country.trim(),
        type: 'city' as const, // Принудительно устанавливаем тип city
        description: suggestion.description || `${suggestion.name} Airport`
      }))
      // Убираем дублирующиеся города
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => 
          s.name.toLowerCase() === suggestion.name.toLowerCase() && 
          s.country.toLowerCase() === suggestion.country.toLowerCase()
        )
      );

    return NextResponse.json({
      suggestions: validSuggestions,
      query: query,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Error in gemini-city-suggestions API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch city suggestions from Gemini',
        suggestions: [],
        query: 'unknown'
      },
      { status: 500 }
    );
  }
}
