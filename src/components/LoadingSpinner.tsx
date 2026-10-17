'use client';

import { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'dots' | 'bars' | 'ripple';
  className?: string;
}

export function LoadingSpinner({ size = 'md', variant = 'default', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse ${className}`}></div>
        );
      
      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`}>
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      case 'bars':
        return (
          <div className={`flex space-x-1 ${className}`}>
            <div className={`w-1 bg-blue-600 animate-pulse`} style={{ animationDelay: '0ms', height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px' }}></div>
            <div className={`w-1 bg-blue-600 animate-pulse`} style={{ animationDelay: '150ms', height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px' }}></div>
            <div className={`w-1 bg-blue-600 animate-pulse`} style={{ animationDelay: '300ms', height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px' }}></div>
            <div className={`w-1 bg-blue-600 animate-pulse`} style={{ animationDelay: '450ms', height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '48px' }}></div>
          </div>
        );
      
      case 'ripple':
        return (
          <div className={`relative ${sizeClasses[size]} ${className}`}>
            <div className={`absolute inset-0 border-2 border-blue-600 rounded-full animate-ping`}></div>
            <div className={`absolute inset-0 border-2 border-blue-600 rounded-full animate-ping`} style={{ animationDelay: '150ms' }}></div>
            <div className={`absolute inset-0 border-2 border-blue-600 rounded-full animate-ping`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      
      default:
        return (
          <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin ${className}`}></div>
        );
    }
  };

  return renderSpinner();
}

// Компонент для анимированного скелетона
export function Skeleton({ className = '', lines = 1 }: { className?: string; lines?: number }) {
  const [widths, setWidths] = useState<string[]>([]);

  useEffect(() => {
    // Генерируем случайные ширины только на клиенте
    const newWidths = Array.from({ length: lines }).map(() => 
      `${Math.random() * 40 + 60}%`
    );
    setWidths(newWidths);
  }, [lines]);

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-slate-200 rounded animate-pulse"
          style={{ 
            width: widths[index] || '75%',
            animationDelay: `${index * 100}ms`
          }}
        ></div>
      ))}
    </div>
  );
}

// Компонент для анимированного прогресс-бара
export function ProgressBar({ 
  progress, 
  className = '', 
  variant = 'default' 
}: { 
  progress: number; 
  className?: string; 
  variant?: 'default' | 'gradient' | 'striped';
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const renderProgressBar = () => {
    const baseClasses = 'h-2 rounded-full transition-all duration-500 ease-out';
    
    switch (variant) {
      case 'gradient':
        return (
          <div className={`w-full bg-slate-200 rounded-full ${className}`}>
            <div 
              className={`${baseClasses} bg-gradient-to-r from-blue-500 to-purple-500`}
              style={{ width: `${clampedProgress}%` }}
            ></div>
          </div>
        );
      
      case 'striped':
        return (
          <div className={`w-full bg-slate-200 rounded-full ${className}`}>
            <div 
              className={`${baseClasses} bg-blue-500 bg-stripes bg-stripes-white`}
              style={{ width: `${clampedProgress}%` }}
            ></div>
          </div>
        );
      
      default:
        return (
          <div className={`w-full bg-slate-200 rounded-full ${className}`}>
            <div 
              className={`${baseClasses} bg-blue-500`}
              style={{ width: `${clampedProgress}%` }}
            ></div>
          </div>
        );
    }
  };

  return renderProgressBar();
}

// Компонент для анимированного счетчика
export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className = '' 
}: { 
  value: number; 
  duration?: number; 
  className?: string; 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={`transition-all duration-300 ${className}`}>
      {displayValue.toLocaleString()}
    </span>
  );
}
