'use client';

import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
  rounded?: boolean;
}

// Базовый skeleton для текста
export function TextSkeleton({ 
  className = '', 
  lines = 3, 
  height = 'h-4',
  width = 'w-full',
  rounded = true 
}: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-slate-200 animate-pulse ${rounded ? 'rounded' : ''} ${width}`}
          style={{ 
            width: index === lines - 1 ? '60%' : '100%',
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

// Skeleton для карточки
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      {/* Заголовок */}
      <div className="h-6 bg-slate-200 rounded animate-pulse mb-4 w-3/4" />
      
      {/* Описание */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
      </div>
      
      {/* Изображение */}
      <div className="h-32 bg-slate-200 rounded-lg animate-pulse mb-4" />
      
      {/* Кнопка */}
      <div className="h-10 bg-slate-200 rounded-lg animate-pulse w-1/3" />
    </div>
  );
}

// Skeleton для карточки отеля
export function HotelCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Изображение */}
      <div className="h-48 bg-slate-200 animate-pulse" />
      
      {/* Контент */}
      <div className="p-4">
        {/* Название */}
        <div className="h-5 bg-slate-200 rounded animate-pulse mb-2 w-4/5" />
        
        {/* Локация */}
        <div className="h-4 bg-slate-200 rounded animate-pulse mb-3 w-3/4" />
        
        {/* Рейтинг */}
        <div className="flex items-center space-x-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
        
        {/* Цена */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 rounded animate-pulse w-20" />
          <div className="h-8 bg-slate-200 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

// Skeleton для карточки полета
export function FlightCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${className}`}>
      {/* Маршрут */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="h-6 bg-slate-200 rounded animate-pulse mb-1 w-16" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-12" />
        </div>
        
        <div className="flex-1 mx-4">
          <div className="h-0.5 bg-slate-200 animate-pulse" />
          <div className="h-3 bg-slate-200 rounded-full animate-pulse w-3 mx-auto mt-1" />
        </div>
        
        <div className="text-center">
          <div className="h-6 bg-slate-200 rounded animate-pulse mb-1 w-16" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-12" />
        </div>
      </div>
      
      {/* Время */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-slate-200 rounded animate-pulse w-20" />
        <div className="h-5 bg-slate-200 rounded animate-pulse w-20" />
      </div>
      
      {/* Авиакомпания и цена */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
        <div className="h-8 bg-slate-200 rounded animate-pulse w-28" />
      </div>
    </div>
  );
}

// Skeleton для карточки аренды автомобиля
export function CarRentalCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Изображение */}
      <div className="h-32 bg-slate-200 animate-pulse" />
      
      {/* Контент */}
      <div className="p-4">
        {/* Название */}
        <div className="h-5 bg-slate-200 rounded animate-pulse mb-2 w-4/5" />
        
        {/* Тип */}
        <div className="h-4 bg-slate-200 rounded animate-pulse mb-3 w-1/2" />
        
        {/* Характеристики */}
        <div className="flex space-x-4 mb-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-4 bg-slate-200 rounded animate-pulse mb-1 w-8" />
              <div className="h-3 bg-slate-200 rounded animate-pulse w-12" />
            </div>
          ))}
        </div>
        
        {/* Цена */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-16" />
          <div className="h-8 bg-slate-200 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

// Skeleton для списка
export function ListSkeleton({ 
  className = '', 
  items = 5,
  itemHeight = 'h-16' 
}: { 
  className?: string;
  items?: number;
  itemHeight?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`${itemHeight} bg-white rounded-lg shadow-sm p-4 animate-pulse`}>
          <div className="flex items-center space-x-4">
            {/* Аватар/иконка */}
            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
            
            {/* Контент */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
            </div>
            
            {/* Действие */}
            <div className="w-20 h-8 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton для таблицы
export function TableSkeleton({ 
  className = '', 
  rows = 5,
  columns = 4 
}: { 
  className?: string;
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Заголовок таблицы */}
      <div className="bg-slate-50 px-6 py-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-slate-200 rounded animate-pulse w-20" />
          ))}
        </div>
      </div>
      
      {/* Строки таблицы */}
      <div className="divide-y divide-slate-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className="h-4 bg-slate-200 rounded animate-pulse w-20"
                  style={{ animationDelay: `${(rowIndex + colIndex) * 50}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton для формы
export function FormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Заголовок формы */}
      <div className="h-6 bg-slate-200 rounded animate-pulse mb-6 w-1/3" />
      
      {/* Поля формы */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="h-4 bg-slate-200 rounded animate-pulse mb-2 w-1/4" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      
      {/* Кнопки */}
      <div className="flex space-x-4 mt-6">
        <div className="h-10 bg-slate-200 rounded animate-pulse w-24" />
        <div className="h-10 bg-slate-200 rounded animate-pulse w-24" />
      </div>
    </div>
  );
}

// Skeleton для профиля пользователя
export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Аватар и основная информация */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-6 bg-slate-200 rounded animate-pulse mb-2 w-1/2" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
      
      {/* Детали профиля */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton для карточки отзыва
export function ReviewCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      {/* Заголовок и рейтинг */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-slate-200 rounded animate-pulse w-1/3" />
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Текст отзыва */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
      </div>
      
      {/* Автор и дата */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
        </div>
        <div className="h-4 bg-slate-200 rounded animate-pulse w-16" />
      </div>
    </div>
  );
}

// Skeleton для карточки статистики
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Иконка */}
      <div className="w-12 h-12 bg-slate-200 rounded-lg animate-pulse mb-4" />
      
      {/* Значение */}
      <div className="h-8 bg-slate-200 rounded animate-pulse mb-2 w-1/2" />
      
      {/* Название */}
      <div className="h-4 bg-slate-200 rounded animate-pulse mb-2 w-3/4" />
      
      {/* Изменение */}
      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
    </div>
  );
}
