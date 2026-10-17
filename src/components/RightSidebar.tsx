'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MoreHorizontal, Calendar, Star, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';
import { useI18n } from '@/i18n/context/I18nContext';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'FLIGHT_BOOKING':
      return DollarSign;
    case 'HOTEL_BOOKING':
      return Star;
    case 'TOUR_BOOKING':
      return Calendar;
    default:
      return DollarSign;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-500';
    case 'PENDING':
      return 'text-orange-500';
    case 'FAILED':
      return 'text-red-500';
    case 'REFUNDED':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function RightSidebar() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setBalance(data);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (retryCount = 0) => {
    try {
      setTransactionsLoading(true);
      const response = await fetch('/api/user/transactions?limit=3');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      
      // Если это сетевая ошибка и не превышено количество попыток, пробуем снова
      if ((err.name === 'TypeError' || err.message.includes('Failed to fetch')) && retryCount < 3) {
        console.log(`Retrying sidebar transactions fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          fetchTransactions(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Увеличиваем задержку с каждой попыткой
        return;
      }
      
      // Если все попытки исчерпаны, показываем пустой список
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchBalance();
      fetchTransactions();
      
      // Подписываемся на события обновления
      const unsubscribeBalance = eventBus.subscribe(BALANCE_UPDATED, fetchBalance);
      const unsubscribeTransactions = eventBus.subscribe('TRANSACTIONS_UPDATED', fetchTransactions);
      
      return () => {
        unsubscribeBalance();
        unsubscribeTransactions();
      };
    }
  }, [session]);

  if (!session) {
    return (
      <div className="w-full lg:w-80 bg-white p-4 lg:p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{t('common.information')}</h2>
        <p className="text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline">
            {t('auth.signIn')}
          </Link>
          , {t('common.toSeeAccountInfo')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white p-4 lg:p-6 rounded-lg shadow-sm">
      {/* User Info */}
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-200">
          {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">
          {session.user?.name}
        </h2>
        <p className="text-gray-500">{session.user?.email}</p>
        <div className="mt-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {t('common.active')}
        </div>
      </div>

      {/* Balance */}
      <div className="mt-6 lg:mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{t('pages.account.balance')}</h3>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            {t('pages.account.topUp')}
          </Link>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-blue-200 rounded mb-2"></div>
              <div className="h-4 bg-blue-200 rounded w-20 mx-auto"></div>
            </div>
          ) : (
            <>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600">
                {balance?.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: balance?.currency || 'USD',
                })}
              </p>
              <p className="text-sm text-blue-500">{t('pages.account.available')}</p>
            </>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="mt-6 lg:mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">{t('pages.account.orderHistory')}</h3>
          <Link href="/transactions" className="text-sm text-blue-600 hover:underline">
            {t('pages.account.allOrders')}
          </Link>
        </div>
        {transactionsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start">
                <div className="bg-gray-100 rounded-lg p-2 mr-4 w-9 h-9" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <ul className="space-y-4">
            {transactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              const statusColor = getStatusColor(transaction.status);
              
              return (
                <li key={transaction.id} className="flex items-start">
                  <div className="bg-gray-100 rounded-lg p-2 mr-4">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-green-600">
                        {transaction.status}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {transaction.amount.toLocaleString('en-US', {
                          style: 'currency',
                          currency: transaction.currency
                        })}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-4">
            {t('transactions.noTransactions')}
          </p>
        )}
      </div>
    </div>
  );
} 