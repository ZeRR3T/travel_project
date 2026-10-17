'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/lib/events';
import { useI18n } from '@/i18n/context/I18nContext';

export const BOOKING_STATUS_UPDATED = 'BOOKING_STATUS_UPDATED';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timeout?: number;
}

export function Notifications() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleBookingUpdate = (data: any) => {
      const { status, type } = data;
      let message = '';
      let notificationType: 'success' | 'error' | 'info' = 'info';

      switch (status) {
        case 'confirmed':
          message = t('notifications.bookingConfirmed', { type: t(`common.${type}`) });
          notificationType = 'success';
          break;
        case 'cancelled':
          message = t('notifications.bookingCancelled', { type: t(`common.${type}`) });
          notificationType = 'info';
          break;
        case 'failed':
          message = t('notifications.bookingFailed', { type: t(`common.${type}`) });
          notificationType = 'error';
          break;
        default:
          message = t('notifications.bookingStatusUpdated', { 
            type: t(`common.${type}`), 
            status: t(`common.${status}`) 
          });
          notificationType = 'info';
      }

      addNotification(message, notificationType);
    };

    // Subscribe and get unsubscribe function
    const unsubscribe = eventBus.subscribe(BOOKING_STATUS_UPDATED, handleBookingUpdate);

    return () => {
      // Cleanup subscription using the returned unsubscribe function
      unsubscribe();
    };
  }, [t]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info', timeout = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, message, type, timeout };
    
    setNotifications(prev => [...prev, notification]);

    if (timeout) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            p-4 rounded-lg shadow-lg max-w-sm relative
            ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'}
          `}
        >
          <button
            onClick={() => removeNotification(notification.id)}
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
            aria-label={t('common.close')}
          >
            ×
          </button>
          <p className="pr-6">{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
