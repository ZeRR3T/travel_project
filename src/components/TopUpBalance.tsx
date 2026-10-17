'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { eventBus, BALANCE_UPDATED } from '@/lib/events';
import { useI18n } from '@/i18n/context/I18nContext';
import { Wallet } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { toast } from 'react-hot-toast';

// Make sure to replace with your publishable key
// Проверяем наличие ключа Stripe
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.error('Stripe publishable key is not configured');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!).catch(error => {
  console.error('Failed to initialize Stripe:', error);
  return null;
});

function CheckoutForm({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!stripe || !elements) {
      setError(t('errors.stripeNotLoaded'));
      setLoading(false);
      return;
    }

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // If we get here, payment was successful
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-navbar p-8 transition-all duration-500 hover:scale-105">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-white mb-3 transition-colors duration-300">{t('home.topUpBalance.completePayment')}</h3>
        <p className="text-slate-300 text-lg transition-colors duration-300">{t('home.topUpBalance.enterCardDetails')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 hover:bg-slate-800/70 border border-slate-600/30">
          <PaymentElement />
        </div>
        
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 transition-all duration-300 animate-pulse backdrop-blur-md">
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !stripe}
          className="w-full btn-navbar py-4 px-6 text-lg font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3 active:scale-95 relative overflow-hidden"
        >
          {/* Enhanced container background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-400/50 rounded-xl backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" variant="default" className="text-white" />
                {t('home.topUpBalance.processing')}
              </div>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </div>
        </button>
      </form>
    </div>
  );
}

export default function TopUpBalance() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [amount, setAmount] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<{ amount: number; currency: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/user/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setBalance(data);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBalance();
    }
  }, [session]);

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Обновляем баланс после успешного платежа
    fetchBalance();
    
    // Очищаем форму
    setAmount('');
    setClientSecret('');
    
    // Показываем уведомление об успешном пополнении
    toast.success(t('balance.topup.success'));
    
    // Оповещаем об обновлении баланса
    eventBus.emit(BALANCE_UPDATED);
  };

  if (!session) {
    return (
      <div className={`text-center transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="card-navbar p-10">
        <h3 className="text-3xl font-bold text-white mb-6">Please sign in to top up your balance</h3>
        <button
          onClick={() => router.push('/auth/signin')}
          className="btn-navbar px-8 py-4 text-lg font-bold text-white"
        >
          Sign In
        </button>
      </div>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm amount={parseFloat(amount)} onSuccess={handlePaymentSuccess} />
        </Elements>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      <div className="card-navbar p-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-6 py-3 rounded-2xl border border-blue-500/30 mb-6 transition-all duration-500 hover:scale-105 shadow-navbar backdrop-blur-md">
            <Wallet className="w-6 h-6 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
            <span className="text-sm font-bold text-blue-400">Secure Payment</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 transition-colors duration-300">
            {t('pages.account.topUpBalance')}
          </h2>
          <p className="text-xl text-slate-300 max-w-md mx-auto transition-colors duration-300">
            {t('home.topUpBalance.topUpBalanceForTravel')}
          </p>
        </div>

        {/* Current Balance */}
        {balance && (
          <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 rounded-3xl p-8 mb-10 border-2 border-blue-500/30 shadow-navbar transition-all duration-500 hover:shadow-navbar-lg hover:scale-105 backdrop-blur-md">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide transition-colors duration-300">
                {t('pages.account.currentBalance')}
              </p>
              <div className="text-5xl font-bold text-gradient-accent transition-all duration-500 hover:scale-110">
                {balance.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: balance.currency || 'USD',
                })}
              </div>
            </div>
          </div>
        )}

        {/* Top Up Form */}
        <form onSubmit={handleAmountSubmit} className="space-y-8">
          <div>
            <label htmlFor="amount" className="block text-lg font-bold text-slate-300 mb-4 transition-colors duration-300">
              {t('payment.amount')} (USD)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <span className="text-slate-400 text-2xl font-bold transition-colors duration-300 group-focus-within:text-blue-400">$</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-16 pr-20 py-5 border-2 border-slate-600/30 rounded-2xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-500 text-xl font-medium bg-slate-800/50 hover:border-slate-500/50 shadow-navbar hover:shadow-navbar-lg focus:scale-105 text-white placeholder-slate-400 backdrop-blur-md"
                placeholder="0.00"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg font-bold transition-colors duration-300">USD</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-5 bg-red-500/20 border-2 border-red-500/30 rounded-2xl text-red-400 transition-all duration-300 animate-pulse backdrop-blur-md">
              <span className="text-base font-bold">{error}</span>
            </div>
          )}

          {/* Beautiful Button Container */}
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
              type="submit"
              disabled={loading || !amount}
              className="w-full py-5 px-8 text-lg font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-3 active:scale-95 relative overflow-hidden group-hover:scale-105 transition-all duration-300"
            >
              {/* Enhanced container background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border-2 border-emerald-400/50 rounded-xl backdrop-blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <LoadingSpinner size="sm" variant="default" className="text-white" />
                    {t('home.topUpBalance.processing')}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                    {t('payment.continueToPayment')}
                  </div>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 bg-emerald-500/20 px-6 py-4 rounded-2xl border-2 border-emerald-500/30 transition-all duration-500 hover:bg-emerald-500/30 hover:border-emerald-500/50 hover:scale-105 shadow-navbar backdrop-blur-md">
            <div className="w-4 h-4 bg-emerald-400 rounded-full transition-all duration-300 animate-pulse"></div>
            <span className="text-sm font-bold text-emerald-400 transition-colors duration-300">
              {t('home.topUpBalance.securityNote')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
