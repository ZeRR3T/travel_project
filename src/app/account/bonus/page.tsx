'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BonusPointsDisplay from '@/components/BonusPointsDisplay';
import { StarIcon, GiftIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/context/I18nContext';

export default function BonusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <StarIcon className="h-8 w-8 text-yellow-500 mr-3" />
            {t('pages.account.bonus.myBonusPoints')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('pages.account.bonus.earnPointsDescription')}
          </p>
        </div>

        {/* Основной контент */}
        <div className="px-4 sm:px-0 space-y-6">
          {/* Отображение бонусных баллов */}
          <BonusPointsDisplay />

          {/* Информация о программе лояльности */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <GiftIcon className="h-5 w-5 text-blue-500 mr-2" />
                {t('pages.account.bonus.loyaltyProgram')}
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">{t('pages.account.bonus.howToEarnPoints')}</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{t('pages.account.bonus.hotelBookingPoints')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{t('pages.account.bonus.flightTicketPoints')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{t('pages.account.bonus.friendInvitationPoints')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{t('pages.account.bonus.registrationPoints')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>{t('pages.account.bonus.promotionMultiplier')}</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">{t('pages.account.bonus.howToUsePoints')}</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2"></span>
                      <span>{t('pages.account.bonus.bookingDiscounts')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2"></span>
                      <span>{t('pages.account.bonus.freeServices')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2"></span>
                      <span>{t('pages.account.bonus.elevatedStatus')}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2"></span>
                      <span>{t('pages.account.bonus.specialOffers')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Текущие акции */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">{t('pages.account.bonus.summerPromotion')}</h2>
                  <p className="text-blue-100 mb-3">
                    {t('pages.account.bonus.doublePointsDescription')}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                       {t('pages.account.bonus.untilJuly31')}
                    </span>
                    <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                       {t('pages.account.bonus.doublePoints')}
                    </span>
                  </div>
                </div>
                <ArrowTrendingUpIcon className="h-16 w-16 text-white opacity-80" />
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('pages.account.bonus.faq')}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    {t('pages.account.bonus.whenPointsAccrued')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.account.bonus.pointsAccrualDescription')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    {t('pages.account.bonus.pointsExpiration')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.account.bonus.pointsNoExpiration')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    {t('pages.account.bonus.transferPoints')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.account.bonus.pointsNotTransferable')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">
                    {t('pages.account.bonus.howManyPointsForBooking')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('pages.account.bonus.pointsCalculationDescription')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Контакты поддержки */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('pages.account.bonus.needHelp')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('pages.account.bonus.supportDescription')}
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {t('pages.account.bonus.contactSupport')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
