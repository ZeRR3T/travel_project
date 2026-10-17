'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/i18n/context/I18nContext';
import Link from 'next/link';
import { Shield, ArrowLeft, RefreshCw, CheckCircle, Sparkles, Mail, Lock, Key } from 'lucide-react';

function VerifyCodePageContent() {
  const { t } = useI18n();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  // Анимация появления страницы
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!userId || !email) {
      router.push('/register');
    }
  }, [userId, email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError(t('pages.authentication.verifyCode.errors.invalidCode'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Здесь должна быть логика верификации кода
      // Пока просто перенаправляем на страницу входа
      setSuccess(true);
      setTimeout(() => {
        router.push('/login?message=verification-success');
      }, 2000);
    } catch (error) {
      setError(t('pages.authentication.verifyCode.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      // Здесь должна быть логика повторной отправки кода
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки
    } catch (error) {
      setError(t('pages.authentication.verifyCode.errors.general'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId || !email) {
    return null;
  }

  if (success) {
    return (
      <div className={`w-full max-w-md text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-4">
          Verification Successful!
        </h2>
        
        <p className="text-slate-600 text-lg mb-8">
          Your account has been verified. Redirecting to login...
        </p>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-purple-700 to-blue-700 bg-clip-text text-transparent mb-2">
          {t('pages.authentication.verifyCode.title')}
        </h1>
        
        <p className="text-slate-600 text-lg">
          {t('pages.authentication.verifyCode.subtitle')}
        </p>
      </div>

      {/* Email Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex items-center text-slate-700">
          <Mail className="w-4 h-4 mr-2 text-blue-500" />
          <span className="text-sm font-medium">Code sent to: {email}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl text-red-700 text-sm font-medium shadow-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            {error}
          </div>
        </div>
      )}

      {/* Verification Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Verification Code Field */}
        <div className="relative">
          <label htmlFor="verificationCode" className="block text-sm font-medium text-slate-700 mb-2">
            Verification Code
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="verificationCode"
              name="verificationCode"
              type="text"
              maxLength={6}
              required
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md text-center text-lg font-mono tracking-widest"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || verificationCode.length !== 6}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Verify Code
            </div>
          )}
        </button>
      </form>

      {/* Resend Code Section */}
      <div className="mt-6 text-center">
        <button
          onClick={handleResendCode}
          disabled={resendLoading}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200 disabled:opacity-50"
        >
          {resendLoading ? (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Resending...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend Code
            </div>
          )}
        </button>
      </div>

      {/* Back to Register */}
      <div className="mt-8 text-center">
        <Link 
          href="/register" 
          className="inline-flex items-center text-slate-600 hover:text-slate-700 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Registration
        </Link>
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="flex items-center text-slate-600 text-sm">
          <Lock className="w-4 h-4 mr-2 text-purple-500" />
          <span>Check your spam folder if you don't see the email</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="animate-pulse">
          <div className="h-16 bg-slate-200 rounded-2xl mb-8"></div>
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          <div className="h-8 bg-slate-200 rounded mb-8"></div>
          <div className="h-16 bg-slate-200 rounded-xl mb-6"></div>
          <div className="h-12 bg-slate-200 rounded-xl mb-6"></div>
          <div className="h-8 bg-slate-200 rounded mb-8"></div>
          <div className="h-8 bg-slate-200 rounded"></div>
        </div>
      </div>
    }>
      <VerifyCodePageContent />
    </Suspense>
  );
}
