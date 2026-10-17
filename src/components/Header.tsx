'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { HelpCircle, Home, Bot, Grid3X3, User, Menu, X, Wallet, Plane, BedDouble, BriefcaseBusiness, Award } from 'lucide-react';
import UserBalance from './UserBalance';
import { CompactLanguageSelector } from '@/i18n/components/LanguageSelector';
import { useI18n } from '@/i18n/context/I18nContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';

// Интервал обновления баланса (30 секунд)
const BALANCE_UPDATE_INTERVAL = 30000;

const navItems = [
  { href: '/', label: 'Home', icon: Home, translationKey: 'common.home' },
  { href: '/search', label: 'AI Search', icon: Bot, translationKey: 'navigation.aiSearch' },
  { href: '/hotels', label: 'Hotels', icon: BedDouble, translationKey: 'pages.hotels.title' },
  { href: '/flights', label: 'Flights', icon: Plane, translationKey: 'pages.flights.title' },
  { href: '/bookings', label: 'Bookings', icon: BriefcaseBusiness, translationKey: 'pages.bookings.title', requiresAuth: true },
  { href: '/dashboard', label: 'Dashboard', icon: Grid3X3, translationKey: 'navigation.dashboard' },
  { href: '/balance', label: 'Balance', icon: Wallet, translationKey: 'pages.balance.title', requiresAuth: true },
  { href: '/transactions', label: 'Transactions', icon: Wallet, translationKey: 'pages.transactions.title', requiresAuth: true },
  { href: '/account', label: 'Account', icon: User, translationKey: 'pages.account.title', requiresAuth: true },
  { href: '/account/bonus', label: 'Bonus Points', icon: Award, translationKey: 'pages.account.bonusPoints', requiresAuth: true },
  { href: '/admin/bonus', label: 'Bonus Admin', icon: Award, translationKey: 'pages.admin.bonus.title', requiresAdmin: true },
];

function isNavItemActive(pathname: string, href: string) {
  return pathname === href
    || (href !== '/account' && pathname.startsWith(`${href}/`))
    || (href === '/hotels' && pathname.startsWith('/hotel/'));
}

export function Header({ title }: { title: string }) {
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Отладка сессии
  useEffect(() => {
    console.log(' Header Session Status:', {
      status,
      hasSession: !!session,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      pathname
    });
  }, [session, status, pathname]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Fetch balance for mobile menu
  const fetchBalance = async () => {
    if (!session?.user) return;
    
    try {
      console.log(' Fetching balance for mobile:', {
        userEmail: session.user.email,
        isMobile: window.innerWidth < 768
      });

      // Используем относительный путь для избежания проблем с доменами
      const response = await fetch('/api/user/balance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log(' Balance API response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log(' Balance data received:', data);
        setBalance(data);
      } else {
        const errorText = await response.text();
        console.error(' Balance API error:', errorText);
      }
    } catch (error) {
      console.error(' Error fetching balance:', error);
    }
  };

  // Fetch balance when session changes or component mounts
  useEffect(() => {
    if (session?.user) {
      fetchBalance();

      // Подписываемся на событие обновления баланса
      const unsubscribe = eventBus.subscribe(BALANCE_UPDATED, fetchBalance);

      // Устанавливаем интервал обновления баланса
      const interval = setInterval(fetchBalance, BALANCE_UPDATE_INTERVAL);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    let isActive = true;
    fetch('/api/bonus/admin-access')
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Admin access check failed: ${response.status}`);
        }
        return response.json() as Promise<{ isAdmin: boolean }>;
      })
      .then(data => {
        if (isActive) setIsAdmin(data.isAdmin);
      })
      .catch(error => {
        console.error('Failed to check admin navigation access:', error);
        if (isActive) setIsAdmin(false);
      });

    return () => {
      isActive = false;
    };
  }, [session]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
      
      <header className="bg-slate-800 border-b border-slate-600/30 shadow-navbar sticky top-0 z-50 w-full">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 min-w-0">
          {/* Logo and Title */}
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0 flex items-center mr-2 sm:mr-4 md:mr-6 lg:mr-8">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-3 md:mr-4 shadow-navbar">
                <span className="text-white font-black text-sm sm:text-lg md:text-xl">T</span>
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-black text-white truncate">Travel Project</span>
            </div>
            
            {/* Medium Screen Navigation (md-lg) - Icons only */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1 ml-2 min-w-0 flex-1 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);
                
                // Показываем элемент только если он не требует авторизации или пользователь авторизован
                if (item.requiresAuth && !session) return null;
                if (item.requiresAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center p-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-navbar'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    title={t(item.translationKey)}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Navigation Menu */}
            <nav className="hidden lg:flex min-w-0 flex-1 items-center space-x-1 xl:space-x-2 ml-2 xl:ml-4 overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);
                
                // Показываем элемент только если он не требует авторизации или пользователь авторизован
                if (item.requiresAuth && !session) return null;
                if (item.requiresAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center px-2 xl:px-3 2xl:px-4 py-2 rounded-xl xl:rounded-2xl text-xs xl:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-navbar'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3 h-3 xl:w-4 xl:h-4 mr-1 xl:mr-2" />
                    <span className="hidden 2xl:inline">{t(item.translationKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 min-w-0">
            {/* Balance - Hidden on very small screens, shown on sm+ */}
            <div className="hidden sm:block lg:hidden">
              <UserBalance />
            </div>
            
            {/* Language Selector */}
            <div className="flex-shrink-0">
              <CompactLanguageSelector className="mr-1 sm:mr-2" />
            </div>
            
            {session ? (
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                {/* User Profile - Hidden on small screens, shown on md+ */}
                <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                  <Link
                    href="/account"
                    className="flex items-center space-x-2 p-1 sm:p-2 rounded-xl sm:rounded-2xl hover:bg-slate-700/50 transition-colors"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={28}
                        height={28}
                        className="rounded-full w-7 h-7 sm:w-8 sm:h-8"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-20 sm:max-w-32 lg:max-w-40">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    {t('common.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 md:space-x-3">
                <button className="p-1 sm:p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-300" />
                </button>
                
                <Link
                  href="/login"
                  className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                >
                  {t('common.signIn')}
                </Link>
                
                <Link
                  href="/register"
                  className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
                >
                  {t('common.signUp')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1 sm:p-2 rounded-xl sm:rounded-2xl hover:bg-slate-700/50 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden transform ${
          isMobileMenuOpen ? 'max-h-screen opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'
        }`}>
          <div className="py-4 border-t border-slate-600/30">
            {/* Mobile Balance and Notifications */}
            {session && (
              <div className="space-y-3 mb-6">
                {/* Mobile Balance */}
                <div className="mobile-menu-item p-4 rounded-2xl bg-slate-700/30 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-emerald-400" />
                      <span className="text-white font-bold">{t('common.balance')}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {balance?.amount ? (
                          balance.amount.toLocaleString('en-US', {
                            style: 'currency',
                            currency: balance.currency || 'USD',
                          })
                        ) : (
                          <div className="h-5 w-20 bg-slate-600 rounded animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      href="/transactions" 
                      onClick={closeMobileMenu}
                      className="flex-1 text-center text-xs text-emerald-400 hover:text-emerald-300 transition-colors py-2 rounded-lg hover:bg-emerald-500/10"
                    >
                      {t('common.viewTransactions')}
                    </Link>
                    <Link 
                      href="/balance" 
                      onClick={closeMobileMenu}
                      className="flex-1 text-center text-xs text-blue-400 hover:text-blue-300 transition-colors py-2 rounded-lg hover:bg-blue-500/10"
                    >
                      {t('common.topUpBalance')}
                    </Link>
                  </div>
                </div>


              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="space-y-2 mb-6">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item.href);
                
                // Показываем элемент только если он не требует авторизации или пользователь авторизован
                if (item.requiresAuth && !session) return null;
                if (item.requiresAdmin && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`mobile-menu-item flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-navbar'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {t(item.translationKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile User Section */}
            {session ? (
              <div className="space-y-4 border-t border-slate-600/30 pt-4">
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-700/30">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">
                      {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-xs text-slate-400">Signed in</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center px-4 py-3 rounded-2xl text-base font-bold text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                  >
                    <User className="w-5 h-5 mr-3" />
                    {t('common.account')}
                  </Link>
                  
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    className="w-full flex items-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors"
                  >
                    <X className="w-5 h-5 mr-3" />
                    {t('common.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 border-t border-slate-600/30 pt-4">
                <button className="w-full flex items-center justify-center p-2 rounded-2xl hover:bg-slate-700/50 transition-colors">
                  <HelpCircle className="w-6 h-6 text-slate-300" />
                </button>
                
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-colors"
                >
                  {t('common.signIn')}
                </Link>
                
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold transition-colors"
                >
                  {t('common.signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
} 
