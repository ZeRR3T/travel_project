'use client';

import { MainLayout } from '@/components/MainLayout';
import { useI18n } from '@/i18n/context/I18nContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Plane, Hotel, Car, Ship } from 'lucide-react';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Page - Session Status:', status);
    console.log('Dashboard Page - Session Data:', session);
    console.log('Dashboard Page - Current URL:', window.location.href);
  }, [session, status]);

  // Show loading state
  if (status === 'loading') {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading Dashboard...</div>
        </div>
      </MainLayout>
    );
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    console.log('User not authenticated, redirecting to login...');
    router.push('/login?callbackUrl=/dashboard');
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Redirecting to login...</div>
        </div>
      </MainLayout>
    );
  }

  const stats = [
    {
      icon: TrendingUp,
      title: t('pages.dashboard.totalBookings'),
      value: '1,247',
      change: '+12%',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      title: t('pages.dashboard.activeUsers'),
      value: '892',
      change: '+8%',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: DollarSign,
      title: t('pages.dashboard.revenue'),
      value: '$45,678',
      change: '+15%',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Calendar,
      title: t('pages.dashboard.thisMonth'),
      value: '156',
      change: '+23%',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentBookings = [
    { type: t('common.flights'), destination: 'Paris, France', date: '2024-01-15', status: t('pages.dashboard.confirmed') },
    { type: t('common.hotels'), destination: 'Tokyo, Japan', date: '2024-01-20', status: t('pages.dashboard.confirmed') },
    { type: t('common.carRental'), destination: 'New York, USA', date: '2024-01-25', status: t('pages.dashboard.pending') },
    { type: t('home.features.cruises.title'), destination: 'Mediterranean', date: '2024-02-01', status: t('pages.dashboard.confirmed') }
  ];

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flights': return Plane;
      case 'hotels': return Hotel;
      case 'car rental': return Car;
      case 'cruises': return Ship;
      default: return Plane;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case t('pages.dashboard.confirmed'): return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case t('pages.dashboard.pending'): return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <MainLayout title={t('pages.dashboard.pageTitle')}>
      {/* Debug Info */}
      <div className="bg-yellow-600/20 border border-yellow-500/30 p-4 mb-4 rounded-lg">
        <p className="text-yellow-300 text-sm">
          Debug: User authenticated as {session?.user?.email || 'Unknown'}
        </p>
      </div>

      {/* Header - Navbar Style */}
      <div className="glass-morphism border-b border-slate-600/30 px-8 py-8">
        <h1 className="text-4xl font-black text-white mb-3">{t('pages.dashboard.pageTitle')}</h1>
        <p className="text-2xl text-slate-300 font-medium">{t('pages.dashboard.welcomeBack')}</p>
      </div>

      {/* Stats Grid - Navbar Style */}
      <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card-navbar p-8 hover-lift">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-3xl flex items-center justify-center shadow-navbar`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-bold text-emerald-400 bg-emerald-500/20 backdrop-blur-md px-3 py-2 rounded-2xl border border-emerald-500/30">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-base font-medium text-slate-300 mb-3">{stat.title}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Recent Bookings - Navbar Style */}
        <div className="card-navbar p-8">
          <h2 className="text-3xl font-bold text-white mb-8">{t('pages.dashboard.recentBookings')}</h2>
          <div className="space-y-4">
            {recentBookings.map((booking, index) => {
              const Icon = getTypeIcon(booking.type);
              return (
                <div key={index} className="flex items-center justify-between p-6 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/30 hover:bg-slate-800/70 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-navbar">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{booking.type}</p>
                      <p className="text-slate-300">{booking.destination}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 mb-2">{booking.date}</p>
                    <span className={`text-sm font-bold px-3 py-2 rounded-2xl backdrop-blur-md border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


