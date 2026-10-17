'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
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

interface BookingCalendarProps {
  bookings: Booking[];
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const formattedEvents = bookings.map((booking) => {
      const isHotel = booking.type === 'hotel';
      const startDate = isHotel
        ? booking.details.checkIn
        : booking.details.departure.date;
      const endDate = isHotel
        ? booking.details.checkOut
        : booking.details.departure.date;

      const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
          case 'confirmed':
            return '#10B981'; // green-500
          case 'pending':
            return '#F59E0B'; // yellow-500
          case 'cancelled':
            return '#EF4444'; // red-500
          default:
            return '#6B7280'; // gray-500
        }
      };

      const getTitle = () => {
        if (isHotel) {
          return `${t('common.hotel')}: ${booking.details.hotelName}`;
        } else {
          return `${t('common.flight')}: ${booking.details.airline} ${booking.details.flightNumber}`;
        }
      };

      return {
        id: booking.id,
        title: getTitle(),
        start: startDate,
        end: endDate,
        allDay: true,
        backgroundColor: getStatusColor(booking.status),
        borderColor: getStatusColor(booking.status),
        extendedProps: {
          type: booking.type,
          status: booking.status,
          details: booking.details,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        },
      };
    });

    setEvents(formattedEvents);
  }, [bookings]);

  const handleEventClick = (info: any) => {
    router.push(`/bookings/${info.event.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        height="auto"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        eventDidMount={(info) => {
          // Добавляем всплывающую подсказку
          const tooltip = document.createElement('div');
          tooltip.className = 'calendar-tooltip';
          tooltip.innerHTML = `
            <div class="bg-white shadow-lg rounded-lg p-4 max-w-xs">
              <div class="font-semibold mb-2">${info.event.title}</div>
              <div class="text-sm text-gray-600">
                <div>${t('common.type')}: ${info.event.extendedProps.type}</div>
                <div>${t('common.status')}: ${info.event.extendedProps.status}</div>
                <div>${t('common.amount')}: ${info.event.extendedProps.totalAmount} ${
            info.event.extendedProps.currency
          }</div>
                ${
                  info.event.extendedProps.type === 'hotel'
                    ? `<div>${t('pages.hotels.nights')}: ${info.event.extendedProps.details.nights}</div>
                       <div>${t('pages.hotels.guests')}: ${info.event.extendedProps.details.guests}</div>`
                    : `<div>${t('common.from')}: ${info.event.extendedProps.details.departure.city}</div>
                       <div>${t('common.to')}: ${info.event.extendedProps.details.arrival.city}</div>`
                }
              </div>
            </div>
          `;

          const element = info.el as HTMLElement;
          element.title = ''; // Отключаем стандартную подсказку

          element.addEventListener('mouseover', () => {
            document.body.appendChild(tooltip);
            const rect = element.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
            tooltip.style.left = `${rect.left + window.scrollX}px`;
            tooltip.style.zIndex = '10000';
          });

          element.addEventListener('mouseout', () => {
            if (tooltip.parentNode) {
              tooltip.parentNode.removeChild(tooltip);
            }
          });
        }}
      />
    </div>
  );
}
