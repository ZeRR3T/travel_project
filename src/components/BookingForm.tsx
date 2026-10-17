'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/context/I18nContext';
import { showBookingSuccess } from '@/lib/toast-store';

interface BookingFormProps {
  hotelId: string;
  hotelName: string;
  pricePerNight: number;
  checkIn?: string;
  checkOut?: string;
}

export function BookingForm({ hotelId, hotelName, pricePerNight, checkIn, checkOut }: BookingFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const totalPrice = pricePerNight * nights;
  const canBook = nights > 0 && guests > 0;

  // Отладочная информация
  console.log('BookingForm - Session status:', status);
  console.log('BookingForm - Session data:', session);

  // Показываем загрузку пока проверяется статус авторизации
  if (status === 'loading') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pages.hotels.bookYourStay')}</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">{t('common.checkingAuthentication')}</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем сообщение о необходимости входа
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pages.hotels.bookYourStay')}</h3>
        
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('common.authenticationRequired')}</h4>
            <p className="text-gray-600 mb-6">{t('pages.hotels.pleaseLogInToBook')}</p>
          </div>
          
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t('pages.hotels.logInToBook')}
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmBooking = () => {
    if (canBook) {
      setShowConfirmModal(true);
    }
  };

  const handleBooking = async () => {
    // Если уже идет загрузка или данные невалидны, не делаем ничего
    if (loading || !canBook) {
      console.log('BookingForm - Already processing or invalid data, skipping...');
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    setError('');

    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // Получаем базовый URL из window.location
      const baseUrl = window.location.origin;
      console.log('BookingForm - Base URL:', baseUrl);

      // Создаем контроллер для отмены запроса
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

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
          type: 'hotel',
          details: {
            hotelId,
            hotelName,
            checkIn,
            checkOut,
            nights,
            guests,
            pricePerNight,
            price: totalPrice,
          },
        }),
      });

      // Проверяем тип контента
      const contentType = response.headers.get('content-type');
      console.log('BookingForm - Response content type:', contentType);
      console.log('BookingForm - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        // Проверяем, что ответ в формате JSON
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create booking');
        } else {
          // Если не JSON, получаем текст ошибки
          const errorText = await response.text();
          console.error('BookingForm - Non-JSON error response:', errorText);
          throw new Error('Server returned invalid response format');
        }
      }

      // Проверяем, что успешный ответ тоже в формате JSON
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('BookingForm - Non-JSON success response:', text);
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();
      if (timeoutId) clearTimeout(timeoutId);
      
      // Показываем уведомление об успешном бронировании
      showBookingSuccess('hotel');
      
      // Перенаправляем на главную страницу
      router.push('/');
    } catch (error) {
      console.error('BookingForm - Error:', error);
      let errorMessage = t('errors.general');
      
      if (error instanceof Error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          errorMessage = t('errors.networkError');
        } else if (error.name === 'AbortError') {
          errorMessage = t('errors.requestTimeout');
        } else {
          errorMessage = error.message;
        }
      } else if (error && typeof error === 'object' && 'error' in error) {
        errorMessage = String((error as { error: unknown }).error);
      }

      // Если это ошибка дублирования, показываем более понятное сообщение
      if (errorMessage.includes('Duplicate booking')) {
        errorMessage = t('errors.duplicateBooking');
      }

      setError(errorMessage);
      
      // Если это ошибка сети, попробуем проверить доступность сервера
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        try {
          const healthCheck = await fetch(`${window.location.origin}/api/health`);
          if (!healthCheck.ok) {
            console.error('BookingForm - Health check failed:', await healthCheck.text());
          }
        } catch (healthError) {
          console.error('BookingForm - Health check error:', healthError);
        }
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{t('pages.hotels.bookYourStay')}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('pages.hotels.numberOfNights')}</label>
          <input
            type="text"
            value={nights === 0 ? '' : nights}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setNights(0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1) {
                  setNights(numValue);
                }
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('pages.hotels.numberOfGuests')}</label>
          <input
            type="text"
            value={guests === 0 ? '' : guests}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setGuests(0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1) {
                  setGuests(numValue);
                }
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">{t('pages.hotels.pricePerNight')}</span>
            <span className="font-medium">${pricePerNight}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">{t('pages.hotels.totalForNights')} {nights} {t('pages.hotels.nights')}</span>
            <span className="text-lg font-bold text-blue-600">${totalPrice}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirmBooking}
          disabled={loading || !canBook}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            loading || !canBook
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          // Добавляем защиту от двойного клика на уровне DOM
          onClickCapture={(e) => {
            if (loading || !canBook) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {loading ? t('common.processing') : t('pages.hotels.bookNow')}
        </button>
      </div>

      {/* Модальное окно подтверждения */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {t('pages.hotels.confirmBooking')}
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                {t('pages.hotels.confirmBookingText')}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('pages.hotels.hotel')}</span>
                  <span className="font-medium">{hotelName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('pages.hotels.nights')}</span>
                  <span className="font-medium">{nights}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('pages.hotels.guests')}</span>
                  <span className="font-medium">{guests}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-800 font-medium">{t('pages.hotels.totalPrice')}</span>
                  <span className="text-lg font-bold text-blue-600">${totalPrice}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t('pages.hotels.confirmAndBook')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
