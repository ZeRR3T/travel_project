'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Небольшая задержка для плавного появления
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-1000 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Компонент для анимированных карточек
export function AnimatedCard({ 
  children, 
  className = '', 
  delay = 0,
  direction = 'up' 
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return 'translate-y-12';
      case 'down':
        return '-translate-y-12';
      case 'left':
        return 'translate-x-12';
      case 'right':
        return '-translate-x-12';
      default:
        return 'translate-y-12';
    }
  };

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100'
          : `opacity-0 ${getTransform()} scale-95`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Компонент для анимированных иконок
export function AnimatedIcon({ 
  children, 
  className = '', 
  animation = 'pulse' 
}: {
  children: ReactNode;
  className?: string;
  animation?: 'pulse' | 'float' | 'rotate' | 'bounce';
}) {
  const animationClasses = {
    pulse: 'animate-pulse',
    float: 'animate-float',
    rotate: 'animate-rotate',
    bounce: 'animate-bounce'
  };

  return (
    <div className={`transition-all duration-300 hover:scale-110 ${animationClasses[animation]} ${className}`}>
      {children}
    </div>
  );
}

// Компонент для анимированных кнопок
export function AnimatedButton({ 
  children, 
  className = '', 
  variant = 'primary' 
}: {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const baseClasses = 'transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </button>
  );
}

// Компонент для анимированных заголовков
export function AnimatedHeading({ 
  children, 
  level = 'h1', 
  className = '', 
  animation = 'fadeInUp' 
}: {
  children: ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
  animation?: 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'bounceIn';
}) {
  const animationClasses = {
    fadeInUp: 'animate-fade-in-up',
    fadeInDown: 'animate-fade-in-down',
    fadeInLeft: 'animate-fade-in-left',
    fadeInRight: 'animate-fade-in-right',
    scaleIn: 'animate-scale-in',
    bounceIn: 'animate-bounce-in'
  };

  const renderHeading = () => {
    const baseClasses = `transition-all duration-500 ${animationClasses[animation]} ${className}`;
    
    switch (level) {
      case 'h1':
        return <h1 className={baseClasses}>{children}</h1>;
      case 'h2':
        return <h2 className={baseClasses}>{children}</h2>;
      case 'h3':
        return <h3 className={baseClasses}>{children}</h3>;
      case 'h4':
        return <h4 className={baseClasses}>{children}</h4>;
      case 'h5':
        return <h5 className={baseClasses}>{children}</h5>;
      case 'h6':
        return <h6 className={baseClasses}>{children}</h6>;
      default:
        return <h1 className={baseClasses}>{children}</h1>;
    }
  };

  return renderHeading();
}
