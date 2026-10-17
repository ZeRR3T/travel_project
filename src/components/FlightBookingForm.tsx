'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/context/I18nContext';
import { showBookingSuccess, showToast } from '@/lib/toast-store';
import { Modal } from '@/components/Modal';
import Portal from '@/components/Portal';

interface FlightBookingFormProps {
  flightNumber: string;
  airline: string;
  departure: { city: string; date: string; time: string };
  arrival: { city: string; date: string; time: string };
  price: string | number;
  passengers: number;
  cabinClass: string;
}

export function FlightBookingForm({
  flightNumber,
  airline,
  departure,
  arrival,
  price,
  passengers,
  cabinClass
}: FlightBookingFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [numPassengers, setNumPassengers] = useState(passengers);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Преобразуем цену в число, удаляя все нечисловые символы, кроме точки
  const pricePerPassenger = typeof price === 'string' 
    ? parseFloat(price.replace(/[^0-9.]/g, '')) 
    : typeof price === 'number' 
      ? price 
      : 0;
      
  // Проверяем, что цена валидная
  const totalPrice = !isNaN(pricePerPassenger) && pricePerPassenger > 0 
    ? pricePerPassenger * numPassengers 
    : 0;
    
  console.log('Flight booking form - Price calculation:', {
    originalPrice: price,
    pricePerPassenger,
    numPassengers,
    totalPrice
  });

  const handleBookingClick = () => {
    if (loading) return;
    
    // Проверяем валидность данных перед отправкой
    if (!flightNumber || !airline || !departure || !arrival) {
      setError('Missing flight details');
      return;
    }

    if (totalPrice <= 0) {
      setError('Invalid price');
      return;
    }

    if (numPassengers <= 0) {
      setError('Invalid number of passengers');
      return;
    }

    if (status === 'unauthenticated' || !session?.user) {
      showToast('Please log in to book a flight.', 'error');
      router.push('/login');
      return;
    }

    // Открываем модальное окно подтверждения
    setIsConfirmModalOpen(true);
  };

  const handleBookingConfirm = async () => {
    setLoading(true);
    setError('');
    setIsConfirmModalOpen(false);

    console.log('Flight booking - Starting booking process:', {
      flightNumber,
      airline,
      departure,
      arrival,
      totalPrice,
      numPassengers,
      cabinClass
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/booking/create`, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          type: 'flight',
          details: {
            flightNumber,
            airline,
            departure,
            arrival,
            price: `$${totalPrice.toFixed(2)}`,
            passengers: numPassengers,
            cabinClass,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create booking' }));
        console.error('Flight booking - API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        });

        if (response.status === 401) {
          showToast('Please log in to continue', 'error');
          router.push('/login');
          return;
        }

        if (response.status === 400 && errorData.error === 'Insufficient funds') {
          setError('Insufficient funds. Please top up your balance.');
          return;
        }

        if (response.status === 400 && errorData.error === 'Invalid price format') {
          setError('Invalid price format. Please try again.');
          return;
        }

        if (response.status === 400 && errorData.error === 'Missing required flight details') {
          setError('Some flight details are missing. Please try again.');
          return;
        }

        throw new Error(errorData.error || 'Failed to create booking');
      }
      
      console.log('Flight booking - Booking successful');
      showBookingSuccess('flight');
      router.push('/');
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Passengers
        </label>
        <select
          value={numPassengers}
          onChange={(e) => setNumPassengers(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {[1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
        <p className="text-sm text-gray-600 mt-1">
          Total Price: ${totalPrice.toFixed(2)}
        </p>
      </div>

      <button
        onClick={handleBookingClick}
        disabled={loading || status === 'loading'}
        className={`w-full py-2 px-4 rounded font-medium transition-colors ${
          loading || status === 'loading'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {status === 'loading' ? 'Authenticating...' : loading ? 'Booking...' : 'Book Now'}
      </button>

      {/* Модальное окно подтверждения на весь экран */}
      {isConfirmModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Заголовок */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {t('pages.flights.confirmBooking')}
                    </h2>
                    <button
                      onClick={() => setIsConfirmModalOpen(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Содержимое */}
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Информация о рейсе */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <h3 className="text-lg font-bold text-blue-900 mb-2">{t('pages.flights.flight')} Details</h3>
                          <div className="space-y-2">
                            <p className="text-blue-800">
                              <span className="font-semibold">{t('pages.flights.flight')}:</span> {flightNumber}
                            </p>
                            <p className="text-blue-800">
                              <span className="font-semibold">{t('pages.flights.airline')}:</span> {airline}
                            </p>
                            <p className="text-blue-800">
                              <span className="font-semibold">{t('pages.flights.class')}:</span> {cabinClass}
                            </p>
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-xl">
                          <h3 className="text-lg font-bold text-green-900 mb-2">{t('pages.flights.passengers')} Info</h3>
                          <p className="text-green-800">
                            <span className="font-semibold">{t('pages.flights.passengers')}:</span> {numPassengers}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-xl">
                          <h3 className="text-lg font-bold text-purple-900 mb-2">Route</h3>
                          <div className="space-y-2">
                            <p className="text-purple-800">
                              <span className="font-semibold">{t('pages.flights.from')}:</span> {departure.city}
                            </p>
                            <p className="text-purple-800">
                              <span className="font-semibold">{t('pages.flights.to')}:</span> {arrival.city}
                            </p>
                          </div>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-xl">
                          <h3 className="text-lg font-bold text-orange-900 mb-2">Schedule</h3>
                          <div className="space-y-2">
                            <p className="text-orange-800">
                              <span className="font-semibold">{t('pages.flights.departure')}:</span> {departure.date} {departure.time}
                            </p>
                            <p className="text-orange-800">
                              <span className="font-semibold">{t('pages.flights.arrival')}:</span> {arrival.date} {arrival.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Цена */}
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-6 rounded-xl text-white">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">{t('pages.flights.totalPrice')}</h3>
                        <p className="text-3xl font-bold">${totalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={() => setIsConfirmModalOpen(false)}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={handleBookingConfirm}
                        disabled={loading}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('pages.flights.processing')}
                          </div>
                        ) : (
                          t('pages.flights.confirmAndBook')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
