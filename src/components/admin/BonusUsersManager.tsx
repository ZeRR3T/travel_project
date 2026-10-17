'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/i18n/context/I18nContext';

interface BonusUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  bonusPoints: {
    points: number;
    totalEarned: number;
    totalSpent: number;
    history: Array<{
      points: number;
      type: string;
      reason: string;
      date: string;
    }>;
  };
}

export default function BonusUsersManager() {
  const { t } = useI18n();
  const [users, setUsers] = useState<BonusUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPointsForm, setShowAddPointsForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BonusUser | null>(null);
  const [addPointsData, setAddPointsData] = useState({
    points: 0,
    reason: '',
    source: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bonus/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          points: addPointsData.points,
          reason: addPointsData.reason,
          source: addPointsData.source
        }),
      });

      if (response.ok) {
        setShowAddPointsForm(false);
        setSelectedUser(null);
        setAddPointsData({ points: 0, reason: '', source: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и поиск */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">{t('pages.admin.bonus.bonusUsersManagement')}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Форма добавления баллов */}
      {showAddPointsForm && selectedUser && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('pages.admin.bonus.addPointsFor')} {selectedUser.name}
          </h3>
          
          <form onSubmit={handleAddPoints} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('pages.admin.bonus.points')}</label>
                <input
                  type="number"
                  value={addPointsData.points}
                  onChange={(e) => setAddPointsData({...addPointsData, points: parseInt(e.target.value)})}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.reason')}</label>
                <input
                  type="text"
                  value={addPointsData.reason}
                  onChange={(e) => setAddPointsData({...addPointsData, reason: e.target.value})}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.source')}</label>
                <input
                  type="text"
                  value={addPointsData.source}
                  onChange={(e) => setAddPointsData({...addPointsData, source: e.target.value})}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddPointsForm(false);
                  setSelectedUser(null);
                  setAddPointsData({ points: 0, reason: '', source: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.add')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список пользователей */}
      {!loading && !error && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="font-medium text-green-600">
                          {user.bonusPoints.points}
                        </span>
                        <span className="ml-1">{t('pages.admin.bonus.points')}</span>
                      </span>
                      <span>{t('pages.admin.bonus.totalEarned')}: {user.bonusPoints.totalEarned}</span>
                      <span>{t('pages.admin.bonus.totalSpent')}: {user.bonusPoints.totalSpent}</span>
                    </div>

                    {/* История последних операций */}
                    {user.bonusPoints.history && user.bonusPoints.history.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                          {t('pages.admin.bonus.recentOperations')}
                        </h4>
                        <div className="space-y-1">
                          {user.bonusPoints.history.slice(0, 3).map((history, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-500">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                history.type === 'earned' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {history.type === 'earned' ? '+' : '-'}{history.points}
                              </span>
                              <span className="ml-2">{history.reason}</span>
                              <span className="ml-auto">{new Date(history.date).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAddPointsForm(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      {t('pages.admin.bonus.addPoints')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? t('common.noUsersFound') : t('common.noUsersFound')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Статистика */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium"></span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('pages.admin.bonus.totalUsers')}</dt>
                    <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium"></span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('pages.admin.bonus.totalPoints')}</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.reduce((sum, user) => sum + user.bonusPoints.points, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium"></span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('pages.admin.bonus.totalEarned')}</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.reduce((sum, user) => sum + user.bonusPoints.totalEarned, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium"></span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{t('pages.admin.bonus.totalSpent')}</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.reduce((sum, user) => sum + user.bonusPoints.totalSpent, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
