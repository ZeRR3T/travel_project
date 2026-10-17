'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/context/I18nContext';

interface BonusStats {
  totalUsers: number;
  totalPoints: number;
  totalEarned: number;
  totalSpent: number;
  activeRules: number;
  monthlyStats: Array<{
    month: string;
    pointsEarned: number;
    pointsSpent: number;
    newUsers: number;
  }>;
  topUsers: Array<{
    name: string;
    email: string;
    points: number;
    totalEarned: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    points: number;
    timestamp: string;
  }>;
}

export default function BonusStats() {
  const { t } = useI18n();
  const [stats, setStats] = useState<BonusStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      // В реальном приложении здесь должен быть API для получения статистики
      // Пока используем моковые данные
      const mockStats: BonusStats = {
        totalUsers: 1250,
        totalPoints: 45600,
        totalEarned: 89000,
        totalSpent: 43400,
        activeRules: 8,
        monthlyStats: [
          { month: 'Янв', pointsEarned: 12000, pointsSpent: 8000, newUsers: 45 },
          { month: 'Фев', pointsEarned: 13500, pointsSpent: 9200, newUsers: 52 },
          { month: 'Мар', pointsEarned: 11800, pointsSpent: 7800, newUsers: 38 },
          { month: 'Апр', pointsEarned: 14200, pointsSpent: 9500, newUsers: 61 },
          { month: 'Май', pointsEarned: 15600, pointsSpent: 11200, newUsers: 67 },
          { month: 'Июн', pointsEarned: 16800, pointsSpent: 12800, newUsers: 73 }
        ],
        topUsers: [
          { name: 'Иван Иванов', email: 'ivan@example.com', points: 1250, totalEarned: 2800 },
          { name: 'Мария Петрова', email: 'maria@example.com', points: 980, totalEarned: 2100 },
          { name: 'Алексей Сидоров', email: 'alex@example.com', points: 850, totalEarned: 1800 },
          { name: 'Елена Козлова', email: 'elena@example.com', points: 720, totalEarned: 1600 },
          { name: 'Дмитрий Волков', email: 'dmitry@example.com', points: 680, totalEarned: 1400 }
        ],
        recentActivity: [
          { id: '1', type: 'earned', description: t('pages.admin.bonus.bonusForHotelBooking'), points: 150, timestamp: new Date().toISOString() },
          { id: '2', type: 'earned', description: t('pages.admin.bonus.referralBonus'), points: 50, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: '3', type: 'spent', description: t('pages.admin.bonus.exchangeForDiscount'), points: -200, timestamp: new Date(Date.now() - 7200000).toISOString() },
          { id: '4', type: 'earned', description: t('pages.admin.bonus.registrationBonus'), points: 25, timestamp: new Date(Date.now() - 10800000).toISOString() },
          { id: '5', type: 'earned', description: t('pages.admin.bonus.bonusForFlightBooking'), points: 100, timestamp: new Date(Date.now() - 14400000).toISOString() }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('pages.admin.bonus.statsNotAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтр по времени */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{t('pages.admin.bonus.bonusSystemStatistics')}</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="week">{t('common.week')}</option>
          <option value="month">{t('common.month')}</option>
          <option value="quarter">{t('common.quarter')}</option>
          <option value="year">{t('common.year')}</option>
        </select>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{t('pages.admin.bonus.totalUsers')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <StarIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{t('pages.admin.bonus.totalPoints')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalEarned.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{t('pages.admin.bonus.totalEarned')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.activeRules}</div>
              <div className="text-sm text-gray-500">{t('pages.admin.bonus.activeRules')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* График по месяцам */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('pages.admin.bonus.monthlyStatistics')}</h3>
        <div className="flex items-end justify-between h-32">
          {stats.monthlyStats.map((monthData, index) => {
            const maxPoints = Math.max(...stats.monthlyStats.map(m => Math.max(m.pointsEarned, m.pointsSpent)));
            const earnedHeight = (monthData.pointsEarned / maxPoints) * 100;
            const spentHeight = (monthData.pointsSpent / maxPoints) * 100;

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="flex flex-col items-center space-y-1 mb-2">
                  <div className="w-full bg-green-200 rounded-t" style={{ height: `${earnedHeight}%` }}>
                    <div className="w-full bg-green-500 rounded-t" style={{ height: '100%' }}></div>
                  </div>
                  <div className="w-full bg-red-200 rounded-t" style={{ height: `${spentHeight}%` }}>
                    <div className="w-full bg-red-500 rounded-t" style={{ height: '100%' }}></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{monthData.month}</span>
                <div className="text-xs text-center mt-1">
                  <div className="text-green-600">+{monthData.pointsEarned}</div>
                  <div className="text-red-600">-{monthData.pointsSpent}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                            {t('pages.admin.bonus.pointsEarned')}
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                            {t('pages.admin.bonus.pointsSpent')}
          </div>
        </div>
      </div>

      {/* Топ пользователей и последняя активность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ пользователей */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{t('pages.admin.bonus.topUsersByPoints')}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.topUsers.map((user, index) => (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user.points} {t('pages.admin.bonus.points')}</div>
                    <div className="text-xs text-gray-500">{t('common.totalAmount')}: {user.totalEarned}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Последняя активность */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{t('pages.admin.bonus.recentActivity')}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.type === 'earned' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.type === 'earned' ? '+' : ''}{activity.points}
                      </span>
                      <span className="text-sm text-gray-900">{activity.description}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ChartBarIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {t('pages.admin.bonus.aboutBonusSystemStatistics')}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                {t('pages.admin.bonus.statisticsDescription')}
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>{t('pages.admin.bonus.metrics')}:</strong> {t('pages.admin.bonus.metricsDescription')}</li>
                <li><strong>{t('pages.admin.bonus.chart')}:</strong> {t('pages.admin.bonus.chartDescription')}</li>
                <li><strong>{t('pages.admin.bonus.topUsers')}:</strong> {t('pages.admin.bonus.topUsersDescription')}</li>
                <li><strong>{t('pages.admin.bonus.activity')}:</strong> {t('pages.admin.bonus.activityDescription')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
