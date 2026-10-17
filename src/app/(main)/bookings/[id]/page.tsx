'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';

interface BookingDetails {
  id: string;
  type: string;
  status: string;
  providerRef: string;
  details: any;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/booking/${params.id}`);
        if (!response.ok) {
          throw new Error(t('errors.general'));
        }
        const data = await response.json();
        setBooking(data.booking);
      } catch (error) {
        setError(error instanceof Error ? error.message : t('errors.general'));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [params.id, session, router, t]);

  if (loading) {
    return (
      <>
        <Header title={t('pages.bookings.bookingDetails')} />
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header title={t('pages.bookings.bookingDetails')} />
        <div className="p-4 sm:p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="text-red-800 text-lg font-semibold mb-2">{t('errors.general')}</h2>
              <p className="text-red-700">{error || t('pages.bookings.notFound')}</p>
            </div>
            <button
              onClick={() => router.push('/bookings')}
              className="mt-4 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
              ← {t('pages.bookings.backToBookings')}
            </button>
          </div>
        </div>
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Header title={t('pages.bookings.bookingDetails')} />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {booking.type === 'hotel' ? 'Hotel Booking' : 'Flight Booking'}
                  </h1>
                  <p className="text-gray-500">Booking ID: {booking.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('pages.bookings.bookingDetails')}</h2>
                {booking.type === 'hotel' ? (
                  <div className="space-y-4">
                    <p><strong>{t('pages.bookings.hotel')}:</strong> {booking.details.hotelName}</p>
                    <p><strong>{t('pages.bookings.checkIn')}:</strong> {booking.details.checkIn}</p>
                    <p><strong>{t('pages.bookings.checkOut')}:</strong> {booking.details.checkOut}</p>
                    <p><strong>{t('pages.bookings.nights')}:</strong> {booking.details.nights}</p>
                    <p><strong>{t('pages.bookings.guests')}:</strong> {booking.details.guests}</p>
                    <p><strong>{t('pages.bookings.pricePerNight')}:</strong> ${booking.details.pricePerNight}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p><strong>{t('pages.bookings.flightNumber')}:</strong> {booking.details.flightNumber}</p>
                    <p><strong>{t('pages.bookings.from')}:</strong> {booking.details.departure}</p>
                    <p><strong>{t('pages.bookings.to')}:</strong> {booking.details.arrival}</p>
                    <p><strong>{t('pages.bookings.date')}:</strong> {booking.details.date}</p>
                    <p><strong>{t('pages.bookings.passengers')}:</strong> {booking.details.passengers}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('pages.bookings.paymentDetails')}</h2>
                <div className="space-y-4">
                  <p><strong>{t('pages.bookings.totalAmount')}:</strong> ${booking.totalAmount}</p>
                  <p><strong>{t('pages.bookings.currency')}:</strong> {booking.currency}</p>
                  <p><strong>{t('pages.bookings.bookingDate')}:</strong> {formatDate(booking.createdAt)}</p>
                  <p><strong>{t('pages.bookings.reference')}:</strong> {booking.providerRef}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => router.push('/bookings')}
                    className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    ← {t('pages.bookings.backToBookings')}
                  </button>
                  {booking.status === 'pending' && (
                    <button
                      onClick={async () => {
                        if (window.confirm(t('pages.bookings.confirmCancel'))) {
                          setCancelling(true);
                          try {
                            const response = await fetch(`/api/booking/${booking.id}/cancel`, {
                              method: 'POST',
                            });
                            
                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.error || t('pages.bookings.failedToCancel'));
                            }
                            
                            const result = await response.json();
                            setBooking(result.result.booking);
                          } catch (error) {
                            setError(error instanceof Error ? error.message : t('pages.bookings.failedToCancel'));
                          } finally {
                            setCancelling(false);
                          }
                        }
                      }}
                      disabled={cancelling}
                      className={`${
                        cancelling
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white px-6 py-3 rounded-lg transition-colors`}
                    >
                      {cancelling ? t('pages.bookings.cancelling') : t('pages.bookings.cancelBooking')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
