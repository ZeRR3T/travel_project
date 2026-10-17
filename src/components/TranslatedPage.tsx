'use client';

import React from 'react';
import { useI18n } from '@/i18n/context/I18nContext';

interface TranslatedPageProps {
  children: React.ReactNode;
  pageKey?: string;
  className?: string;
}

export function TranslatedPage({ children, pageKey, className = '' }: TranslatedPageProps) {
  const { t, currentLanguage } = useI18n();

  // Автоматически переводим все текстовые узлы в children
  const translateChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      // Если это строка, пытаемся перевести её
      const translation = t(children);
      return translation !== children ? translation : children;
    }

    if (React.isValidElement(children)) {
      // Если это React элемент, рекурсивно переводим его children
      const newChildren = React.Children.map(children.props.children, translateChildren);
      
      // Создаем новый элемент с переведенными children
      return React.cloneElement(children, {
        ...children.props,
        children: newChildren,
      });
    }

    if (Array.isArray(children)) {
      // Если это массив, переводим каждый элемент
      return children.map(translateChildren);
    }

    return children;
  };

  return (
    <div className={className} data-language={currentLanguage}>
      {translateChildren(children)}
    </div>
  );
}

// Хук для автоматического перевода текста
export function useAutoTranslate() {
  const { t, currentLanguage } = useI18n();

  const translate = (text: string, fallback?: string): string => {
    const translation = t(text);
    return translation !== text ? translation : (fallback || text);
  };

  const translateArray = (texts: string[]): string[] => {
    return texts.map(text => translate(text));
  };

  const translateObject = (obj: Record<string, string>): Record<string, string> => {
    const translated: Record<string, string> = {};
    Object.keys(obj).forEach(key => {
      translated[key] = translate(obj[key]);
    });
    return translated;
  };

  return {
    translate,
    translateArray,
    translateObject,
    currentLanguage,
    t
  };
}

// HOC для автоматического перевода компонентов
export function withTranslation<P extends object>(
  Component: React.ComponentType<P>,
  translationKeys?: Record<string, string>
) {
  return function TranslatedComponent(props: P) {
    const { t, currentLanguage } = useI18n();

    // Если переданы ключи переводов, применяем их
    if (translationKeys) {
      const translatedProps = { ...props };
      Object.keys(translationKeys).forEach(key => {
        if (props[key as keyof P]) {
          const translationKey = translationKeys[key];
          const translation = t(translationKey);
          if (translation !== translationKey) {
            translatedProps[key as keyof P] = translation as any;
          }
        }
      });
      return <Component {...translatedProps} />;
    }

    return <Component {...props} />;
  };
}
