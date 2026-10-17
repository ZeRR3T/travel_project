import { NextResponse } from 'next/server';
import { getWeather } from '@/lib/weather';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const date = searchParams.get('date');

  console.log(' Weather API request:', { city, date });

  if (!city) {
    console.log(' Weather API error: No city provided');
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  // Проверяем API ключ
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  console.log(' API Key status:', apiKey ? 'Present' : 'Missing');
  
  if (!apiKey) {
    console.log(' Weather API error: No API key configured');
    return NextResponse.json({ 
      error: 'OpenWeatherMap API key is not configured. Please add OPENWEATHERMAP_API_KEY to your .env.local file.' 
    }, { status: 500 });
  }

  try {
    console.log(' Fetching weather data from OpenWeatherMap...');
    const weatherData = await getWeather(city, date || undefined);
    console.log(' Weather data received:', weatherData);
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error(' Weather API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
} 