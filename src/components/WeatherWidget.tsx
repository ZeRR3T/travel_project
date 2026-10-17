'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/i18n/context/I18nContext';

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

interface WeatherWidgetProps {
  city: string;
  date?: string;
}

export default function WeatherWidget({ city, date }: WeatherWidgetProps) {
  const { t } = useI18n();
  const [weather, setWeather] = useState<{ current: WeatherData; forecast: ForecastDay[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log(' Fetching weather for:', { city, date });
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}${date ? `&date=${date}` : ''}`);
        console.log(' Weather API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log(' Weather API error response:', errorData);
          throw new Error(errorData.error || t('errors.failedToFetchWeatherData'));
        }
        
        const data = await response.json();
        console.log(' Weather data received:', data);
        
        setWeather(data);
      } catch (err) {
        console.error(' Weather fetch error:', err);
        setError(err instanceof Error ? err.message : t('errors.failedToLoadWeather'));
      } finally {
        setLoading(false);
      }
    };

    if (city) {
      console.log(' City changed, fetching weather for:', city);
      fetchWeather();
    } else {
      console.log(' No city provided for weather widget');
      setLoading(false);
    }
  }, [city, date]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">{t('weather.weatherInformation')}</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{t('weather.unableToLoadWeatherData')}</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          {error.includes('API key') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                <strong>{t('weather.setupRequired')}:</strong> {t('weather.addOpenWeatherMapApiKey')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">{t('weather.weatherIn')} {city}</h2>
      
      {/* Current Weather */}
      <div className="flex items-center mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex-shrink-0">
          <img src={weather.current.icon} alt={weather.current.description} width={64} height={64} />
        </div>
        <div className="ml-4">
          <div className="text-3xl font-bold">{weather.current.temperature}°C</div>
          <div className="text-gray-600 capitalize">{weather.current.description}</div>
          <div className="text-sm text-gray-500">
            {t('weather.humidity')}: {weather.current.humidity}% | {t('weather.wind')}: {weather.current.windSpeed} m/s
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="grid grid-cols-5 gap-2">
        {weather.forecast.map((day, index) => (
          <div key={index} className="text-center p-2">
            <div className="text-sm font-medium">{day.date}</div>
            <img src={day.icon} alt={day.description} className="mx-auto" width={40} height={40} />
            <div className="text-sm">
              <span className="text-red-500">{day.temperature.max}°</span>
              {' / '}
              <span className="text-blue-500">{day.temperature.min}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 