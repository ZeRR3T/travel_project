'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { BookingFilters, type BookingFilters as BookingFiltersType } from '@/components/BookingFilters';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingExport } from '@/components/BookingExport';
import { BookingReminders } from '@/components/BookingReminders';
import { useI18n } from '@/i18n/context/I18nContext';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    loadBookings();
  }, [session, router]);

  const loadBookings = async (filters?: BookingFiltersType) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/bookings${filters ? `?${new URLSearchParams(filters as any)}` : ''}`
      );
      if (!response.ok) {
        throw new Error('Failed to load bookings');
      }
      const data = await response.json();
      setBookings(data.bookings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: BookingFiltersType) => {
    loadBookings(filters);
  };

  if (loading) {
    return (
      <>
        <Header title={t('pages.bookings.title')} />
        <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
          <div className="max-w-8xl mx-auto">
            <div className="animate-pulse">
              <div className="h-12 bg-slate-800 rounded-2xl w-1/4 mb-6"></div>
              <div className="h-8 bg-slate-800 rounded-2xl w-1/2 mb-12"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-slate-800 rounded-3xl"></div>
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
        <Header title={t('pages.bookings.title')} />
        <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
          <div className="max-w-8xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-400 mb-6">{t('errors.general')}</h1>
              <p className="text-slate-300 text-xl mb-8">{error}</p>
              <button
                onClick={() => loadBookings()}
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
      <Header title={t('pages.bookings.title')} />
      <div className="p-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
        <div className="max-w-8xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
                  <span className="text-gradient-primary">{t('pages.bookings.title')}</span>
                </h1>
                <p className="text-2xl text-slate-300 font-medium">
                  {t('pages.bookings.active')}
                </p>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <BookingFilters onFilterChange={handleFilterChange} />
              </div>

              {/* Bookings List */}
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-slate-400 text-2xl font-medium">{t('pages.bookings.noBookings')}</p>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="card-navbar p-8 hover-lift"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-3">
                            {booking.type === 'hotel' ? t('booking.type.hotel') : 
                             booking.type === 'flight' ? t('booking.type.flight') : 
                             booking.type === 'tour' ? t('booking.type.tour') : 
                             booking.type === 'cruise' ? t('booking.type.cruise') : 
                             booking.type === 'car' ? t('booking.type.car') : 
                             booking.type === 'taxi' ? t('booking.type.taxi') : 
                             t('common.unknown')}
                          </h3>
                          <p className="text-slate-300 text-lg mb-2">
                            {t('pages.bookings.bookingNumber')}: {booking.providerRef}
                          </p>
                          <p className="text-slate-400">
                            {t('pages.bookings.bookingDate')}: {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white mb-3">
                            ${booking.transaction?.amount || 0}
                          </div>
                          <span className={`inline-flex items-center px-3 py-2 rounded-2xl text-sm font-bold backdrop-blur-md border ${
                            booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }`}>
                            {booking.status === 'confirmed' ? t('booking.status.confirmed') :
                             booking.status === 'pending' ? t('booking.status.pending') :
                             booking.status === 'cancelled' ? t('booking.status.cancelled') :
                             booking.status === 'completed' ? t('booking.status.completed') :
                             booking.status === 'inProgress' ? t('booking.status.inProgress') :
                             booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-6">
              <BookingCalendar bookings={bookings} />
              <BookingExport bookings={bookings} />
              <BookingReminders bookings={bookings} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
