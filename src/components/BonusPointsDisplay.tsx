'use client';

import { useState, useEffect } from 'react';
import { StarIcon, GiftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/context/I18nContext';

interface BonusPoints {
  points: number;
  totalEarned: number;
  totalSpent: number;
  history: Array<{
    id: string;
    points: number;
    type: string;
    reason: string;
    source: string;
    createdAt: string;
  }>;
}

export default function BonusPointsDisplay() {
  const { t } = useI18n();
  const [bonusPoints, setBonusPoints] = useState<BonusPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchBonusPoints();
  }, []);

  const fetchBonusPoints = async () => {
    try {
      const response = await fetch('/api/bonus');
      if (response.ok) {
        const data = await response.json();
        setBonusPoints(data);
      }
    } catch (error) {
      console.error('Error fetching bonus points:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!bonusPoints) {
    return null;
  }

  const recentHistory = bonusPoints.history.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Основная информация */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
            {t('pages.account.bonusPoints')}
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showHistory ? t('common.hideHistory') : t('common.showHistory')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bonusPoints.points.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{t('pages.account.availablePoints')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {bonusPoints.totalEarned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{t('pages.account.totalEarned')}</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {bonusPoints.totalSpent.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">{t('pages.account.totalSpent')}</div>
          </div>
        </div>

        {/* Информация о бонусах */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <GiftIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">{t('pages.account.howToEarnBonusPoints')}</p>
              <ul className="space-y-1 text-blue-700">
                <li>• {t('pages.account.bookHotelsAndFlights')}</li>
                <li>• {t('pages.account.inviteFriends')}</li>
                <li>• {t('pages.account.participateInPromotions')}</li>
                <li>• {t('pages.account.leaveTripReviews')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* История операций */}
      {showHistory && (
        <div className="border-t border-gray-200">
          <div className="px-6 py-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
              {t('pages.account.transactionHistory')}
            </h4>
            
            {recentHistory.length > 0 ? (
              <div className="space-y-3">
                {recentHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.type === 'earned' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.type === 'earned' ? '+' : '-'}{item.points}
                        </span>
                        <span className="text-sm text-gray-900">{item.reason}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString()} • {item.source || t('common.system')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>{t('pages.account.transactionHistoryEmpty')}</p>
                <p className="text-sm">{t('pages.account.makeFirstBookingToEarnPoints')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
