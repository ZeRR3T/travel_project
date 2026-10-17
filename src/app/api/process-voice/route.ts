import { NextResponse } from 'next/server';

interface SearchParams {
  from?: string;
  to?: string;
  date?: string;
  returnDate?: string;
  guests?: number;
  type: 'hotel' | 'flight';
}

// Простое правило-основанное распознавание без внешних API
function parseVoiceQuery(text: string): SearchParams {
  console.log(' Parsing voice query:', text);
  
  const lowerText = text.toLowerCase();
  
  // Определяем тип поиска
  const isHotel = lowerText.includes('отель') || lowerText.includes('гостиница') || lowerText.includes('hotel');
  const isFlight = lowerText.includes('билет') || lowerText.includes('самолет') || lowerText.includes('авиа') || lowerText.includes('flight');
  
  const type: 'hotel' | 'flight' = isHotel ? 'hotel' : isFlight ? 'flight' : 'hotel'; // по умолчанию отель
  
  const result: SearchParams = { type };
  
  // Вместо извлечения отдельных параметров, используем весь текст для поиска
  // Но сохраняем структурированные данные для возможного будущего использования
  result.to = text; // Используем весь текст как поисковый запрос
  
  // Извлекаем место назначения (после "в" или "to") для логирования
  let inMatch = text.match(/в\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)*)/);
  let toMatch = text.match(/to\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
  
  // Если не удалось извлечь, пробуем альтернативные паттерны
  if (!inMatch && !toMatch) {
    // Ищем после "отель" или "гостиница"
    inMatch = text.match(/(?:отель|гостиница)\s+в\s+([А-Яа-я]+(?:\s+[А-Яа-я]+)*)/);
    toMatch = text.match(/(?:hotel)\s+in\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
  }
  
  // Улучшенное извлечение названий городов
  if (inMatch) {
    const extractedCity = inMatch[1].trim();
    // Убираем лишние слова после названия города
    const cleanCity = extractedCity.replace(/\s+(?:на|с|по|для|от|до).*$/, '').trim();
    console.log(' Extracted destination (в):', cleanCity);
  } else if (toMatch) {
    const extractedCity = toMatch[1].trim();
    const cleanCity = extractedCity.replace(/\s+(?:from|on|for|to|from).*$/, '').trim();
    console.log(' Extracted destination (to):', cleanCity);
  }
  
  // Извлекаем количество гостей для логирования
  const guestsMatch = text.match(/(\d+)\s*(?:гост|guest|человек|person)/);
  if (guestsMatch) {
    result.guests = parseInt(guestsMatch[1]);
    console.log(' Extracted guests:', result.guests);
  }
  
  // Извлекаем даты для логирования
  const dateMatch = text.match(/(\d{1,2})\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/);
  if (dateMatch) {
    const month = getMonthNumber(dateMatch[2]);
    const day = parseInt(dateMatch[1]);
    const year = new Date().getFullYear();
    result.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log(' Extracted date:', result.date);
  }
  
  console.log(' Final parsed result:', result);
  console.log(' Full search query will be:', result.to);
  return result;
}

function getMonthNumber(monthName: string): number {
  if (!monthName) {
    console.warn(' Month name is undefined or empty');
    return 1;
  }
  
  const months: { [key: string]: number } = {
    'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4, 'мая': 5, 'июня': 6,
    'июля': 7, 'августа': 8, 'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
  };
  
  const month = months[monthName.toLowerCase()];
  if (month) {
    console.log(` Month "${monthName}" -> ${month}`);
    return month;
  } else {
    console.warn(` Unknown month: "${monthName}"`);
    return 1;
  }
}

// Тестовая функция для проверки парсинга
function testParsing() {
  const testCases = [
    'Найди отель в Москве',
    'Найди гостиницу в Санкт-Петербурге на 2 гостя',
    'Отель в Париже с 20 по 25 сентября',
    'Найди авиабилеты из Москвы в Лондон на завтра',
    'Найди отель в Нью-Йорке для 3 человек',
    'Гостиница в Риме с 15 августа'
  ];
  
  console.log(' Testing parsing:');
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    const result = parseVoiceQuery(testCase);
    console.log(`Input: "${testCase}"`);
    console.log(`Result:`, result);
    console.log(`Search query: "${result.to}"`);
  });
}

// Запускаем тесты в development режиме
if (process.env.NODE_ENV === 'development') {
  testParsing();
}

export async function POST(request: Request) {
  try {
    console.log(' POST request received to /api/process-voice');
    const { text } = await request.json();
    console.log(' Received voice input:', text);

    if (!text) {
      console.warn(' No text provided in request');
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log(' Parsing voice query with rules');
    const result = parseVoiceQuery(text);
    console.log(' Sending response:', result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error(' Error processing voice input:', error);
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    );
  }
} 