'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Plane, Globe, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

interface CitySuggestion {
  name: string;
  country: string;
  type: 'city' | 'airport' | 'region';
  description?: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

// Функция для получения подсказок городов от Gemini
const getCitySuggestions = async (query: string): Promise<CitySuggestion[]> => {
  try {
    const response = await fetch('/api/gemini-city-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch city suggestions from Gemini');
    }

    const result = await response.json();
    return result.suggestions || [];
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
    return [];
  }
};

// Debounce функция для оптимизации запросов
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  className = '',
  disabled = false
}: CityAutocompleteProps) {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [lastSelectedValue, setLastSelectedValue] = useState<string>(''); // Отслеживаем последний выбранный город
  
  const defaultPlaceholder = t('common.enterCityOrAirport');

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Используем debounce для оптимизации запросов
  const debouncedValue = useDebounce(value, 300);

  // Сбрасываем lastSelectedValue если value изменился извне (например, при очистке формы)
  useEffect(() => {
    if (value === '') {
      setLastSelectedValue('');
    }
  }, [value]);

  // Получаем подсказки при изменении значения
  useEffect(() => {
    // Показываем подсказки только если:
    // 1. Есть значение длиной >= 2 символов
    // 2. Компонент не отключен
    // 3. Значение изменилось с момента последнего выбора (редактирование)
    if (debouncedValue && debouncedValue.trim().length >= 2 && !disabled) {
      // Проверяем, изменилось ли значение с момента последнего выбора
      const isEditing = debouncedValue !== lastSelectedValue;
      
      if (isEditing) {
        setIsLoading(true);
        getCitySuggestions(debouncedValue)
          .then((citySuggestions) => {
            setSuggestions(citySuggestions);
            setShowSuggestions(citySuggestions.length > 0);
            setFocusedIndex(-1);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        // Если значение не изменилось (тот же город), не показываем подсказки
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedValue, disabled, lastSelectedValue]);

  // Обработка клика вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Обработка клавиатуры
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleSuggestionSelect(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: CitySuggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    setSuggestions([]); // Очищаем подсказки после выбора
    setLastSelectedValue(suggestion.name); // Запоминаем выбранный город
    inputRef.current?.blur();
  };

  const getTypeIcon = (type: string) => {
    // Теперь все подсказки - это города с аэропортами
    return <Globe className="w-4 h-4 text-blue-500" />;
  };

  const getTypeLabel = (type: string) => {
    // Теперь все подсказки - это города с аэропортами
    return t('common.cityWithAirport');
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue);
          
          // Если введено точное название уже выбранного города, очищаем подсказки
          if (newValue === lastSelectedValue) {
            setSuggestions([]);
            setShowSuggestions(false);
          }
          
          // Если пользователь удаляет текст, сбрасываем lastSelectedValue
          if (newValue === '') {
            setLastSelectedValue('');
          }
        }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Показываем подсказки только если есть активные подсказки И значение изменилось
            // И не показываем для уже выбранного города
            if (suggestions.length > 0 && value !== lastSelectedValue) {
              setShowSuggestions(true);
            } else if (value === lastSelectedValue) {
              // Если фокусируемся на уже выбранном городе, не показываем подсказки
              setShowSuggestions(false);
              setSuggestions([]);
            }
          }}
          placeholder={placeholder || defaultPlaceholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder-black ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}

        {/* Иконка поиска */}
        {!isLoading && value && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Выпадающий список подсказок */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
                           {suggestions.map((suggestion, index) => (
                   <button
                     key={`${suggestion.name}-${suggestion.country}-${index}`}
                     type="button"
                     onClick={() => handleSuggestionSelect(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                index === focusedIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getTypeIcon(suggestion.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {getTypeLabel(suggestion.type)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 truncate">
                    {suggestion.country}
                  </div>
                  
                  {suggestion.description && (
                    <div className="text-xs text-blue-600 truncate font-medium">
                       {suggestion.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Подсказка о том, как использовать */}
      {value && value.length > 0 && value.length < 2 && (
        <div className="mt-1 text-xs text-gray-500">
          {t('common.enterMinimumTwoCharacters')}
        </div>
      )}
      

    </div>
  );
}
