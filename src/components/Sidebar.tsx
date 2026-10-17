'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bot, Route, Ship, Grid3X3, User, LogOut } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';
import { signOut } from 'next-auth/react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  translationKey: string;
}

const navItems: NavItem[] = [
  {
    icon: Home,
    label: 'Home',
    href: '/',
    translationKey: 'common.home'
  },
  {
    icon: Bot,
    label: 'AI Search',
    href: '/ai-search',
    translationKey: 'navigation.aiSearch'
  },
  {
    icon: Route,
    label: 'Tours',
    href: '/tours',
    translationKey: 'navigation.tours'
  },
  {
    icon: Ship,
    label: 'Cruises',
    href: '/cruises',
    translationKey: 'navigation.cruises'
  },
  {
    icon: Grid3X3,
    label: 'Dashboard',
    href: '/dashboard',
    translationKey: 'navigation.dashboard'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0">
      <div className="p-4">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'
                  }`} 
                />
                <span className="font-medium">
                  {t(item.translationKey)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="space-y-2">
            {/* Account */}
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group"
            >
              <User className="w-5 h-5 text-slate-500 group-hover:text-slate-900 transition-colors duration-200" />
              <span className="font-medium">
                {t('navigation.account')}
              </span>
            </Link>

            {/* Sign Out */}
            <button               onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group"
            >
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center relative">
                <span className="text-white text-xs font-bold">N</span>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-red-500"></div>
              </div>
              <span className="font-medium">
                {t('navigation.signOut')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 