'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nContextValue, Language, TranslationData } from '../types/translation';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '' }
];

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState<TranslationData>({});

  useEffect(() => {
    // Загружаем переводы для текущего языка
    loadTranslations(currentLanguage);
    
    // Загружаем язык из localStorage
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
      loadTranslations(savedLanguage);
    }
  }, []);

  const loadTranslations = async (languageCode: string) => {
    try {
      console.log(` Loading translations for language: ${languageCode}`);
      const response = await fetch(`/i18n/translations/${languageCode}.json`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(` Successfully loaded translations for ${languageCode}:`, Object.keys(data).length, 'top-level keys');
        console.log(` Available keys:`, Object.keys(data));
        setTranslations(data);
      } else {
        console.warn(` Failed to load translations for ${languageCode} (${response.status}), falling back to English`);
        // Fallback к английскому
        const fallbackResponse = await fetch('/i18n/translations/en.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log(' Successfully loaded fallback English translations:', Object.keys(fallbackData).length, 'top-level keys');
          setTranslations(fallbackData);
        } else {
          console.error(' Failed to load fallback English translations:', fallbackResponse.status);
        }
      }
    } catch (error) {
      console.error(' Error loading translations:', error);
      // Fallback к английскому
      try {
        const fallbackResponse = await fetch('/i18n/translations/en.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log(' Successfully loaded fallback English translations after error:', Object.keys(fallbackData).length, 'top-level keys');
          setTranslations(fallbackData);
        } else {
          console.error(' Failed to load fallback English translations after error:', fallbackResponse.status);
        }
      } catch (fallbackError) {
        console.error(' Error loading fallback translations:', fallbackError);
      }
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (supportedLanguages.some(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferred_language', languageCode);
      await loadTranslations(languageCode);
    }
  };

  const t = (key: string): string => {
    // Поддерживаем вложенные ключи типа "home.welcome.title"
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Если перевод не найден, логируем и возвращаем ключ
        if (process.env.NODE_ENV === 'development') {
          console.warn(` Translation key not found: ${key} (missing: ${k})`);
          console.warn(` Available keys at this level:`, value ? Object.keys(value) : 'no object');
        }
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const value: I18nContextValue = {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    t
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
