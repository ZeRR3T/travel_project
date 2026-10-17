'use client';

import { ReactNode, useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

interface AnimatedNotificationProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
  closable?: boolean;
}

export function AnimatedNotification({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  className = '',
  showIcon = true,
  closable = true
}: AnimatedNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Анимация появления
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    // Автоматическое закрытие
    const autoCloseTimer = setTimeout(() => {
      if (duration > 0) {
        handleClose();
      }
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: CheckCircle,
          iconColor: 'text-emerald-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: AlertCircle,
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          iconColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconColor: 'text-blue-500'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] max-w-sm w-full ${className}`}
      style={{
        transform: isVisible && !isClosing ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isClosing ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className={`${styles.bg} ${styles.border} border-2 rounded-xl shadow-lg p-4 backdrop-blur-sm`}>
        <div className="flex items-start space-x-3">
          {showIcon && (
            <div className={`flex-shrink-0 ${styles.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`text-sm font-semibold ${styles.text} mb-1`}>
                {title}
              </h4>
            )}
            <p className={`text-sm ${styles.text}`}>
              {message}
            </p>
          </div>
          
          {closable && (
            <button
              onClick={handleClose}
              className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity duration-200`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент для тостов
export function Toast({ 
  children, 
  type = 'info', 
  className = '' 
}: { 
  children: ReactNode; 
  type?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg ${getTypeStyles()} ${className}`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
}

// Компонент для анимированных бейджей
export function AnimatedBadge({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: ReactNode; 
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVariantStyles()} ${className}`}
      style={{
        transform: isVisible ? 'scale(1)' : 'scale(0)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </span>
  );
}
