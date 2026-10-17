'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useI18n } from '@/i18n/context/I18nContext';
import { useSearchParams } from 'next/navigation';

interface GoogleButtonProps {
  className?: string;
}

export default function GoogleButton({ className = '' }: GoogleButtonProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  
  const handleGoogleSignIn = async () => {
    console.log(' Google sign in button clicked');
    console.log(' Starting Google OAuth flow...');
    console.log(' Current URL:', window.location.href);
    console.log(' Environment:', process.env.NODE_ENV);
    console.log(' Current Cookies:', document.cookie);
    
    // Очищаем старые cookies перед входом
    document.cookie = 'next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'next-auth.callback-url=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    document.cookie = 'next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      console.log(' Using callback URL:', callbackUrl);
      
      const result = await signIn('google', { 
        callbackUrl: callbackUrl,
        redirect: false // Добавляем это для отладки
      });
      
      console.log(' Google sign in result:', result);
      
      if (result?.error) {
        console.error(' Google sign in error:', result.error);
        console.error(' Error details:', result);
      } else if (result?.url) {
        console.log(' Google sign in successful, redirecting to:', result.url);
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(' Exception during Google sign in:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className={`group flex items-center justify-center w-full px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 hover:bg-white ${className}`}
      type="button"
    >
      <svg className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span className="transition-colors duration-200 group-hover:text-slate-900 font-medium">
        {t('auth.continueWithGoogle')}
      </span>
    </button>
  );
} 