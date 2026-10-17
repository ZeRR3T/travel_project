'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';

export default function ResetBalancePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const resetBalance = async () => {
      try {
        const response = await fetch('/api/user/reset-balance', {
          method: 'POST',
        });
        
        if (!response.ok) throw new Error('Failed to reset balance');
        
        const data = await response.json();
        console.log('Balance reset:', data);
        
        // Redirect back to home page
        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Error resetting balance:', error);
      }
    };

    if (session?.user) {
      resetBalance();
    }
  }, [session, router]);

  if (!session) {
    return (
      <>
        <Header title={t('pages.account.title')} />
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{t('errors.unauthorized')}</h1>
            <p className="text-gray-600">{t('auth.signIn')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={t('pages.account.title')} />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('pages.resetBalance.title')}
          </h1>
          <p className="text-gray-600">
            {t('pages.resetBalance.description')}
          </p>
        </div>
      </div>
    </>
  );
}
