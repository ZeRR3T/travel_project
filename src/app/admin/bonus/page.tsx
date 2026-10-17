'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BonusRulesManager from '@/components/admin/BonusRulesManager';
import BonusSettingsManager from '@/components/admin/BonusSettingsManager';
import BonusUsersManager from '@/components/admin/BonusUsersManager';
import BonusStats from '@/components/admin/BonusStats';
import { useI18n } from '@/i18n/context/I18nContext';

export default function BonusAdminPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('stats');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
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
        if (!isActive) return;
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) router.replace('/dashboard');
      })
      .catch(error => {
        console.error('Failed to verify bonus admin access:', error);
        if (isActive) router.replace('/dashboard');
      });

    return () => {
      isActive = false;
    };
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || isAdmin !== true) {
    return null;
  }

  const tabs = [
    { id: 'stats', name: t('pages.admin.bonus.tabs.stats'), icon: '' },
    { id: 'rules', name: t('pages.admin.bonus.tabs.rules'), icon: '' },
    { id: 'settings', name: t('pages.admin.bonus.tabs.settings'), icon: '' },
    { id: 'users', name: t('pages.admin.bonus.tabs.users'), icon: '' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('pages.admin.bonus.title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('pages.admin.bonus.description')}
          </p>
        </div>

        {/* Навигационные вкладки */}
        <div className="px-4 sm:px-0">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Содержимое вкладок */}
        <div className="mt-8 px-4 sm:px-0">
          {activeTab === 'stats' && <BonusStats />}
          {activeTab === 'rules' && <BonusRulesManager />}
          {activeTab === 'settings' && <BonusSettingsManager />}
          {activeTab === 'users' && <BonusUsersManager />}
        </div>
      </div>
    </div>
  );
}
