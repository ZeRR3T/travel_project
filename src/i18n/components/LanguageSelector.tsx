'use client';

import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { ChevronDown, Globe } from 'lucide-react';

export function LanguageSelector() {
  const { currentLanguage, supportedLanguages, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-slate-700 border border-slate-600 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-48 mt-2 bg-slate-700 border border-slate-600 rounded-md shadow-lg">
          <div className="py-1">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-600 ${
                  currentLanguage === language.code ? 'bg-slate-600 text-white' : 'text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{language.flag}</span>
                  <div>
                    <div className="font-medium">{language.name}</div>
                    <div className="text-xs text-slate-300">{language.nativeName}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompactLanguageSelector({ className = '' }: { className?: string }) {
  const { currentLanguage, supportedLanguages, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-white hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
      >
        <span className="text-lg">{currentLang?.flag}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 w-40 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg">
          <div className="py-1">
            {supportedLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 ${
                  currentLanguage === language.code ? 'bg-slate-600 text-white' : 'text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  <span className="truncate">{language.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
