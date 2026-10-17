'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  isMain?: boolean;
}

interface AirportSelectorProps {
  city: string;
  selectedAirports: string[];
  onAirportSelect: (airportCodes: string[]) => void;
  label: string;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

// Функция для получения аэропортов от Gemini
const getAirportsFromGemini = async (city: string): Promise<Airport[]> => {
  try {
    const response = await fetch('/api/gemini-airports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch airports from Gemini');
    }

    const result = await response.json();
    return result.airports || [];
  } catch (error) {
    console.error('Error fetching airports from Gemini:', error);
    return [];
  }
};

export default function AirportSelector({
  city,
  selectedAirports,
  onAirportSelect,
  label,
  placeholder,
  className = '',
  multiple = false,
  disabled = false
}: AirportSelectorProps) {
  const { t } = useI18n();
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultPlaceholder = t('common.selectAirport');

  useEffect(() => {
    if (city && city.trim().length > 2) {
      setIsLoading(true);
      getAirportsFromGemini(city)
        .then((cityAirports) => {
          setAirports(cityAirports);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setAirports([]);
    }
  }, [city]);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  const filteredAirports = airports.filter(airport =>
    airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAirportSelect = (airportCode: string) => {
    if (multiple) {
      // Multiple selection mode
      const newSelection = selectedAirports.includes(airportCode)
        ? selectedAirports.filter(code => code !== airportCode)
        : [...selectedAirports, airportCode];
      onAirportSelect(newSelection);
    } else {
      // Single selection mode
      onAirportSelect([airportCode]);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = () => {
    onAirportSelect([]);
    setSearchQuery('');
  };

  const selectedAirportsData = airports.filter(ap => selectedAirports.includes(ap.code));

  // Не показываем селектор если нет аэропортов или город слишком короткий
  if (!city || city.trim().length <= 2 || airports.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <label className={`block text-sm font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
        {disabled && <span className="text-xs text-gray-400 ml-2">(locked)</span>}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled || isLoading
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-gray-500">Loading airports...</span>
              </div>
            </div>
          ) : selectedAirportsData.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {selectedAirportsData.map((airport, index) => (
                  <span key={airport.code} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {airport.code}
                    {airport.isMain && (
                      <span className="ml-1 px-1 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        {t('common.main')}
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-between text-gray-500">
              <span>{placeholder || defaultPlaceholder}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </button>

        {selectedAirports.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder={t('common.searchAirport')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="py-1">
            {filteredAirports.length > 0 ? (
              filteredAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => handleAirportSelect(airport.code)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    selectedAirports.includes(airport.code) ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {multiple && (
                        <input
                          type="checkbox"
                          checked={selectedAirports.includes(airport.code)}
                          readOnly
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {airport.code}
                          {airport.isMain && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {t('common.main')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{airport.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {airport.city}, {airport.country}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                {t('common.noAirportsFoundFor')} {city}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
