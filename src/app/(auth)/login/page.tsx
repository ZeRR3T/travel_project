'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import GoogleButton from '@/components/GoogleButton';
import { useI18n } from '@/i18n/context/I18nContext';
import { Lock, Mail, Eye, EyeOff, Sparkles, Plane, Shield, Zap } from 'lucide-react';

function LoginContent() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Анимация появления страницы
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle OAuth errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthAccountNotLinked':
          setError(t('pages.authentication.login.errors.oauthAccountNotLinked'));
          break;
        case 'OAuthSignin':
          setError(t('pages.authentication.login.errors.oauthSignin'));
          break;
        case 'OAuthCallback':
          setError(t('pages.authentication.login.errors.oauthCallback'));
          break;
        case 'OAuthCreateAccount':
          setError(t('pages.authentication.login.errors.oauthCreateAccount'));
          break;
        case 'EmailCreateAccount':
          setError(t('pages.authentication.login.errors.emailCreateAccount'));
          break;
        case 'Callback':
          setError(t('pages.authentication.login.errors.callback'));
          break;
        case 'EmailSignin':
          setError(t('pages.authentication.login.errors.emailSignin'));
          break;
        case 'CredentialsSignin':
          setError(t('pages.authentication.login.errors.credentialsSignin'));
          break;
        case 'SessionRequired':
          setError(t('pages.authentication.login.errors.sessionRequired'));
          break;
        default:
          setError(t('pages.authentication.login.errors.general'));
      }
    }
    
    // Handle success messages
    if (messageParam === 'verification-success') {
      setError(''); // Clear any existing errors
    }
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      console.log('Login attempt with callback URL:', callbackUrl);
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        setError(t('pages.authentication.login.errors.invalidCredentials'));
      } else {
        console.log('Login successful, redirecting to:', callbackUrl);
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('pages.authentication.login.errors.general'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`w-full max-w-md transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-2">
          {t('pages.authentication.login.title')}
        </h1>
        
        <p className="text-slate-600 text-lg">
          {t('pages.authentication.login.subtitle')}
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <Shield className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-blue-700 font-medium">Secure</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
          <Zap className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-emerald-700 font-medium">Fast</p>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <Plane className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <p className="text-xs text-purple-700 font-medium">Global</p>
        </div>
      </div>

      {/* Google Sign In */}
      <div className="mb-6">
        <GoogleButton className="w-full" />
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-slate-500 font-medium">
            {t('pages.authentication.login.orContinueWith')}
          </span>
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

      {/* Login Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="relative">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
            {t('pages.authentication.login.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            {t('pages.authentication.login.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
              {t('pages.authentication.login.rememberMe')}
            </label>
          </div>

          <Link 
            href="#" 
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
          >
            {t('pages.authentication.login.forgotPassword')}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('pages.authentication.login.signingIn')}
            </div>
          ) : (
            <div className="flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              {t('pages.authentication.login.signIn')}
            </div>
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-slate-600">
          {t('pages.authentication.login.subtitle')}{' '}
          <Link 
            href="/register" 
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 underline decoration-2 underline-offset-2"
          >
            {t('pages.authentication.login.createAccount')}
          </Link>
        </p>
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="flex items-center text-slate-600 text-sm">
          <Shield className="w-4 h-4 mr-2 text-blue-500" />
          <span>Your data is protected with enterprise-grade security</span>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="animate-pulse">
          <div className="h-16 bg-slate-200 rounded-2xl mb-8"></div>
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          <div className="h-8 bg-slate-200 rounded mb-8"></div>
          <div className="h-12 bg-slate-200 rounded-xl mb-4"></div>
          <div className="h-12 bg-slate-200 rounded-xl mb-4"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
} 