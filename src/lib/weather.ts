interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  date: string;
}

interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
  };
  description: string;
  icon: string;
}

export async function getWeather(city: string, date?: string): Promise<{ current: WeatherData; forecast: ForecastDay[] }> {
  const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  console.log(' Checking OpenWeatherMap API key:', API_KEY ? 'Present' : 'Missing');
  
  if (!API_KEY) {
    throw new Error('OpenWeatherMap API key is not configured');
  }

  try {
    // Получаем координаты города
    console.log(' Getting coordinates for city:', city);
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const geoResponse = await fetch(geoUrl);
    
    if (!geoResponse.ok) {
      console.error(' Geo API error:', await geoResponse.text());
      throw new Error('Failed to get city coordinates');
    }
    
    const geoData = await geoResponse.json();
    console.log(' Geo API response:', geoData);

    if (!geoData.length) {
      console.error(' City not found:', city);
      throw new Error('City not found');
    }

    const { lat, lon } = geoData[0];
    console.log(' Coordinates:', { lat, lon });

    // Получаем текущую погоду и прогнозk
    console.log(' Fetching weather data...');
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      console.error(' Weather API error:', await weatherResponse.text());
      throw new Error('Failed to get weather data');
    }
    
    const weatherData = await weatherResponse.json();
    console.log(' Weather API response:', weatherData);

    // Форматируем текущую погоду
    const current: WeatherData = {
      temperature: Math.round(weatherData.current.temp),
      description: weatherData.current.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`,
      humidity: weatherData.current.humidity,
      windSpeed: Math.round(weatherData.current.wind_speed),
      date: new Date(weatherData.current.dt * 1000).toLocaleDateString()
    };

    // Форматируем прогноз на 5 дней
    const forecast: ForecastDay[] = weatherData.daily.slice(0, 5).map((day: any) => ({
      date: new Date(day.dt * 1000).toLocaleDateString(),
      temperature: {
        min: Math.round(day.temp.min),
        max: Math.round(day.temp.max)
      },
      description: day.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`
    }));

    const result = { current, forecast };
    console.log(' Formatted weather data:', result);
    return result;
  } catch (error) {
    console.error(' Weather API Error:', error);
    throw error;
  }
} 