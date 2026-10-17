'use client';

import TopUpBalance from '@/components/TopUpBalance';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/context/I18nContext';

export default function BalancePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-black text-white">
            <span className="text-gradient-primary">{t('pages.balance.pageTitle')}</span>
          </h1>
          <button
            onClick={() => router.push('/transactions')}
            className="btn-navbar px-8 py-4 text-lg font-bold text-white"
          >
            {t('pages.balance.viewTransactions')}          </button>
        </div>
        <TopUpBalance />
      </div>
    </div>
  );
}
