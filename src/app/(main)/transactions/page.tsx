'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/Header';
import { ArrowUpCircle, ArrowDownCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';
import { useI18n } from '@/i18n/context/I18nContext';
import { Modal } from '@/components/Modal';
import TopUpBalance from '@/components/TopUpBalance';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

// Константы для повторных попыток
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export default function TransactionsPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });

  const fetchTransactions = async (page = 1, retryCount = 0) => {
    try {
      setLoading(true);
      setError('');
      console.log(' Fetching transactions for page:', page);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
      });

      console.log(' Request params:', Object.fromEntries(params.entries()));

      const response = await fetch(`/api/user/transactions?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(' API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          retryAfter: response.headers.get('Retry-After')
        });

        // Проверяем заголовок Retry-After для 503 ошибки
        if (response.status === 503 && retryCount < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(BASE_DELAY * Math.pow(2, retryCount), 5000);
          
          console.log(` Service unavailable, retrying in ${retryDelay}ms...`);
          setTimeout(() => {
            fetchTransactions(page, retryCount + 1);
          }, retryDelay);
          return;
        }
        
        // Специфичные сообщения об ошибках
        if (response.status === 401) {
          throw new Error(t('errors.unauthorized'));
        } else if (response.status === 404) {
          throw new Error(t('errors.notFound'));
        } else if (response.status === 503) {
          throw new Error(t('errors.serviceUnavailable'));
        }
        
        throw new Error(errorData.error || t('errors.failedToFetch'));
      }

      const data = await response.json();
      console.log(' Transactions response:', {
        count: data.transactions?.length,
        pagination: data.pagination
      });
      
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error(t('errors.invalidData'));
      }

      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error(' Error fetching transactions:', err);
      
      // Если это сетевая ошибка и не превышено количество попыток, пробуем снова
      if ((err.name === 'TypeError' || err.message === 'Failed to fetch') && retryCount < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 5000);
        console.log(` Retrying transaction fetch (attempt ${retryCount + 1}) in ${delay}ms...`);
        setTimeout(() => {
          fetchTransactions(page, retryCount + 1);
        }, delay);
        return;
      }
      
      // Если это ошибка сервиса и есть Retry-After, пробуем снова
      if (err.message === t('errors.serviceUnavailable') && retryCount < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 5000);
        console.log(` Service unavailable, retrying in ${delay}ms...`);
        setTimeout(() => {
          fetchTransactions(page, retryCount + 1);
        }, delay);
        return;
      }
      
      setError(err.message || t('errors.general'));
      setTransactions([]); // Очищаем транзакции при ошибке
      setPagination(null); // Сбрасываем пагинацию
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (retryCount = 0) => {
    try {
      console.log(' Fetching balance...');
      const response = await fetch('/api/user/balance', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(' Balance API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        });
        throw new Error(errorData.error || 'Failed to fetch balance');
      }
      
      const data = await response.json();
      console.log(' Balance data:', data);
      
      if (!data || typeof data.amount !== 'number' || !data.currency) {
        throw new Error('Invalid balance data received');
      }
      
      setBalance(data);
    } catch (err: any) {
      console.error(' Error fetching balance:', err);
      
      // Если это сетевая ошибка и не превышено количество попыток, пробуем снова
      if ((err.name === 'TypeError' || err.message === 'Failed to fetch') && retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(` Retrying balance fetch (attempt ${retryCount + 1}) in ${delay}ms...`);
        setTimeout(() => {
          fetchBalance(retryCount + 1);
        }, delay);
        return;
      }
      
      setBalance(null);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchTransactions(1);
      fetchBalance();

      // Подписываемся на событие обновления баланса
      const unsubscribe = eventBus.subscribe(BALANCE_UPDATED, fetchBalance);
      
      return () => unsubscribe();
    }
  }, [session, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment':
        return t('payment.methods.card');
      case 'refund':
        return t('payment.refunded');
      case 'deposit':
        return t('pages.transactions.deposits');
      case 'withdrawal':
        return t('pages.transactions.withdrawals');
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  if (loading) {
    return (
      <>
        <Header title={t('pages.transactions.title')} />
        <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
          <div className="max-w-8xl mx-auto">
            <div className="animate-pulse">
              <div className="h-12 bg-slate-800 rounded-2xl w-1/4 mb-6"></div>
              <div className="h-8 bg-slate-800 rounded-2xl w-1/2 mb-8"></div>
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-slate-800 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title={t('pages.transactions.title')} />
        <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
          <div className="max-w-8xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-400 mb-6">{t('errors.general')}</h1>
              <p className="text-slate-300 text-xl mb-8">{error}</p>
              <button
                onClick={() => fetchTransactions()}
                className="btn-navbar px-8 py-4 text-lg font-bold text-white"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={t('pages.transactions.title')} />
      <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <div className="max-w-8xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
              <span className="text-gradient-primary">{t('pages.transactions.title')}</span>
            </h1>
            <p className="text-2xl text-slate-300 font-medium">
              {t('pages.transactions.all')}
            </p>
          </div>

          {/* Balance Display */}
          {balance && (
            <div className="card-navbar p-8 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    {t('pages.dashboard.balance')}
                  </h2>
                  <div className="text-4xl font-bold text-gradient-accent">
                    {balance.amount} {balance.currency}
                  </div>
                </div>
                {/* Beautiful Top Up Button Container */}
                <div className="relative group">
                  {/* Decorative corner elements */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-l-2 border-t-2 border-emerald-400/50 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-r-2 border-t-2 border-blue-400/50 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-2 border-b-2 border-blue-400/50 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-2 border-b-2 border-emerald-400/50 rounded-br-xl opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300"></div>
                  
                  {/* Floating accent dots */}
                  <div className="absolute -top-2 -left-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-500"></div>
                  <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-500 delay-200"></div>
                  <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-500 delay-400"></div>
                  <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-all duration-500 delay-600"></div>
                  
                  {/* Glowing background effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  
                  {/* Main button */}
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="relative z-10 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 border border-emerald-400/30 hover:border-emerald-300/50"
                  >
                    {t('pages.account.topUp')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card-navbar p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">{t('searchFunctions.filters')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-bold text-slate-300 mb-3">
                  {t('common.type')}
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-600/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-white backdrop-blur-md"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="payment">{t('payment.methods.card')}</option>
                  <option value="refund">{t('payment.refunded')}</option>
                  <option value="deposit">{t('pages.transactions.deposits')}</option>
                  <option value="withdrawal">{t('pages.transactions.withdrawals')}</option>
                </select>
              </div>
              <div>
                <label className="block text-base font-bold text-slate-300 mb-3">
                  {t('common.status')}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-600/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800/50 text-white backdrop-blur-md"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="completed">{t('payment.completed')}</option>
                  <option value="pending">{t('payment.pending')}</option>
                  <option value="failed">{t('payment.failed')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="card-navbar overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-600/30">
              <h3 className="text-2xl font-bold text-white">
                {t('pages.transactions.all')}
              </h3>
            </div>
            <div className="divide-y divide-slate-600/30">
              {transactions.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <p className="text-slate-400 text-2xl font-medium">{t('pages.transactions.noTransactions')}</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="px-8 py-6 hover:bg-slate-800/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(transaction.status)}
                        <div>
                          <p className="text-lg font-bold text-white mb-2">
                            {getTypeLabel(transaction.type)}
                          </p>
                          <p className="text-slate-300 mb-2">
                            {transaction.description}
                          </p>
                          <p className="text-slate-400">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white mb-3">
                          {transaction.amount} {transaction.currency}
                        </p>
                        <span className={`inline-flex items-center px-3 py-2 rounded-2xl text-sm font-bold backdrop-blur-md border ${getStatusColor(transaction.status)}`}>
                          {transaction.status === 'completed' ? t('payment.completed') :
                           transaction.status === 'pending' ? t('payment.pending') :
                           transaction.status === 'failed' ? t('payment.failed') :
                           transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-3">
                {pagination.currentPage > 1 && (
                  <button
                    onClick={() => fetchTransactions(pagination.currentPage - 1)}
                    className="px-6 py-3 text-base font-bold text-slate-300 bg-slate-800/50 border border-slate-600/30 rounded-2xl hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-md"
                  >
                    {t('pagination.previous')}
                  </button>
                )}
                <span className="px-6 py-3 text-base font-bold text-slate-300">
                  {t('pagination.page')} {pagination.currentPage} {t('pagination.of')} {pagination.pages}
                </span>
                {pagination.currentPage < pagination.pages && (
                  <button
                    onClick={() => fetchTransactions(pagination.currentPage + 1)}
                    className="px-6 py-3 text-base font-bold text-slate-300 bg-slate-800/50 border border-slate-600/30 rounded-2xl hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-md"
                  >
                    {t('pagination.next')}
                  </button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Top Up Balance"
      >
        <TopUpBalance />
      </Modal>
    </>
  );
}