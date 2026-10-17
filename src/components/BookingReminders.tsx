'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

interface Booking {
  id: string;
  type: string;
  status: string;
  details: any;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

interface BookingRemindersProps {
  bookings: Booking[];
}

export function BookingReminders({ bookings }: BookingRemindersProps) {
  const { t } = useI18n();
  const [reminders, setReminders] = useState<Booking[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = new Date();
    const upcomingBookings = bookings.filter(booking => {
      if (booking.status !== 'confirmed') return false;
      
      const isHotel = booking.type === 'hotel';
      const checkInDate = isHotel 
        ? new Date(booking.details.checkIn)
        : new Date(booking.details.departure.date);
      
      // Показываем напоминания за 7 дней, 3 дня и 1 день до бронирования
      const daysUntil = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntil >= 0 && daysUntil <= 7 && !dismissed.has(booking.id);
    });

    setReminders(upcomingBookings);
  }, [bookings, dismissed]);

  const dismissReminder = (bookingId: string) => {
    setDismissed(prev => new Set([...prev, bookingId]));
  };

  const getReminderMessage = (booking: Booking) => {
    const isHotel = booking.type === 'hotel';
    const checkInDate = isHotel 
      ? new Date(booking.details.checkIn)
      : new Date(booking.details.departure.date);
    
    const daysUntil = Math.ceil((checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (isHotel) {
      return t('pages.bookings.hotelStayReminder').replace('{hotelName}', booking.details.hotelName).replace('{days}', daysUntil.toString());
    } else {
      return t('pages.bookings.flightReminder').replace('{airline}', booking.details.airline).replace('{flightNumber}', booking.details.flightNumber).replace('{days}', daysUntil.toString());
    }
  };

  const getReminderType = (booking: Booking) => {
    const isHotel = booking.type === 'hotel';
    const checkInDate = isHotel 
      ? new Date(booking.details.checkIn)
      : new Date(booking.details.departure.date);
    
    const daysUntil = Math.ceil((checkInDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 1) return 'urgent';
    if (daysUntil <= 3) return 'warning';
    return 'info';
  };

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {reminders.map((booking) => {
        const type = getReminderType(booking);
        const bgColor = type === 'urgent' ? 'bg-red-50 border-red-200' :
                       type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                       'bg-blue-50 border-blue-200';
        const textColor = type === 'urgent' ? 'text-red-800' :
                         type === 'warning' ? 'text-yellow-800' :
                         'text-blue-800';
        const iconColor = type === 'urgent' ? 'text-red-500' :
                         type === 'warning' ? 'text-yellow-500' :
                         'text-blue-500';

        return (
          <div
            key={booking.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${bgColor}`}
          >
            <div className="flex items-center space-x-3">
              <Bell className={`w-5 h-5 ${iconColor}`} />
              <div>
                <p className={`text-sm font-medium ${textColor}`}>
                  {getReminderMessage(booking)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {booking.type === 'hotel' ? t('common.hotel') : t('common.flight')} • {booking.totalAmount} {booking.currency}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissReminder(booking.id)}
              className={`p-1 rounded-full hover:bg-white/50 transition-colors ${textColor}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
