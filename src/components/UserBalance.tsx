'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Wallet } from 'lucide-react';
import Link from 'next/link';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';
import { useI18n } from '@/i18n/context/I18nContext';

interface Balance {
  amount: number;
  currency: string;
  updatedAt: string;
}

export default function UserBalance() {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchBalance = async () => {
    try {
      console.log('Fetching balance for user:', session?.user?.email);
      setLoading(true);
      setError('');
      
      // Используем относительный путь для избежания проблем с доменами
      const response = await fetch('/api/user/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для cookies
      });
      
      console.log('Balance API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Balance API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Balance data received:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setBalance(data);
      setRetryCount(0); // Сбрасываем счетчик попыток при успехе
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      console.error('Error fetching balance:', err);
      setError(errorMessage);
      
      // Автоматический retry при ошибках сети
      if (retryCount < 3 && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
        console.log(`Retrying balance fetch (${retryCount + 1}/3)...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchBalance();
        }, 2000 * (retryCount + 1)); // Экспоненциальная задержка
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('UserBalance useEffect - session status:', status);
    console.log('UserBalance useEffect - session user:', session?.user);
    
    if (status === 'loading') {
      console.log('Session is still loading...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('User is not authenticated');
      setLoading(false);
      return;
    }
    
    if (session?.user) {
      console.log('User authenticated, fetching balance...');
      fetchBalance();
      
      // Подписываемся на событие обновления баланса
      const unsubscribe = eventBus.subscribe(BALANCE_UPDATED, fetchBalance);
      
      return () => unsubscribe();
    }
  }, [session, status]);

  // Показываем состояние загрузки сессии
  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
        <Wallet className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-slate-400" />
        <div className="h-4 w-16 sm:h-5 sm:w-20 bg-slate-600 rounded animate-pulse"></div>
      </div>
    );
  }

  // Не показываем компонент если пользователь не аутентифицирован
  if (!session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/30">
        <Wallet className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse text-slate-400" />
        <div className="h-4 w-16 sm:h-5 sm:w-20 bg-slate-600 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-red-900/30 backdrop-blur-sm border border-red-600/30 hover:bg-red-900/40 hover:border-red-500/50 transition-all duration-300">
        <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
        <div className="flex flex-col min-w-0">
          <span className="text-xs sm:text-sm text-red-300 truncate">{t('errors.errorLoadingBalance')}</span>
          <button 
            onClick={fetchBalance}
            className="text-xs text-blue-300 hover:text-blue-200 underline transition-colors duration-200 hover:no-underline"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href="/transactions" 
      className="group flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-700/50 hover:bg-slate-600/70 backdrop-blur-sm border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/25 relative overflow-hidden"
    >
      {/* Animated background on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-emerald-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-emerald-500/10 transition-all duration-500 rounded-xl"></div>
      
      {/* Glowing border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-emerald-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/20 group-hover:to-emerald-400/20 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* Wallet icon with hover effects */}
        <div className="relative">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white group-hover:text-blue-200 transition-all duration-300 group-hover:scale-110" />
          {/* Glow effect around icon */}
          <div className="absolute inset-0 w-4 h-4 sm:w-5 sm:h-5 bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-125"></div>
        </div>
        
        {/* Balance text with hover effects */}
        <span className="text-xs sm:text-sm font-medium text-white group-hover:text-slate-100 transition-all duration-300 group-hover:font-semibold truncate">
          {balance?.amount.toLocaleString('en-US', {
            style: 'currency',
            currency: balance?.currency || 'USD',
          })}
        </span>
        
        {/* Subtle arrow indicator */}
        <div className="w-0 group-hover:w-2 h-0 group-hover:h-2 border-r-2 border-t-2 border-white/60 rotate-45 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
      </div>
      
      {/* Ripple effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Link>
  );
}
