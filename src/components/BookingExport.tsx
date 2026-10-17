'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
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

interface BookingExportProps {
  bookings: Booking[];
}

export function BookingExport({ bookings }: BookingExportProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const formatBookingData = (booking: Booking) => {
    const isHotel = booking.type === 'hotel';
    const details = booking.details;

    if (isHotel) {
      return {
        id: booking.id,
        type: t('common.hotel'),
        status: booking.status,
        name: details.hotelName,
        checkIn: details.checkIn,
        checkOut: details.checkOut,
        nights: details.nights,
        guests: details.guests,
        amount: `${booking.totalAmount} ${booking.currency}`,
        date: new Date(booking.createdAt).toLocaleDateString(),
      };
    } else {
      return {
        id: booking.id,
        type: t('common.flight'),
        status: booking.status,
        airline: details.airline,
        flightNumber: details.flightNumber,
        from: details.departure.city,
        to: details.arrival.city,
        date: details.departure.date,
        passengers: details.passengers,
        amount: `${booking.totalAmount} ${booking.currency}`,
        bookingDate: new Date(booking.createdAt).toLocaleDateString(),
      };
    }
  };

  const exportToPDF = () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text(t('pages.bookings.bookingReport'), 14, 22);
      doc.setFontSize(10);
      doc.text(`${t('common.generatedOn')}: ${new Date().toLocaleString()}`, 14, 30);

      // Отдельные таблицы для отелей и авиабилетов
      const hotelBookings = bookings.filter(b => b.type === 'hotel');
      const flightBookings = bookings.filter(b => b.type === 'flight');

      if (hotelBookings.length > 0) {
        doc.setFontSize(16);
        doc.text(t('pages.bookings.hotelBookings'), 14, 40);
        
        const hotelData = hotelBookings.map(booking => {
          const data = formatBookingData(booking);
          return [
            data.id,
            data.status,
            data.name,
            data.checkIn,
            data.checkOut,
            data.nights.toString(),
            data.guests.toString(),
            data.amount,
            data.date,
          ];
        });

        (doc as any).autoTable({
          startY: 45,
          head: [[t('common.id'), t('common.status'), t('common.hotel'), t('pages.hotels.checkIn'), t('pages.hotels.checkOut'), t('pages.hotels.nights'), t('pages.hotels.guests'), t('common.amount'), t('pages.bookings.bookingDate')]],
          body: hotelData,
        });
      }

      if (flightBookings.length > 0) {
        const startY = hotelBookings.length > 0 ? (doc as any).lastAutoTable.finalY + 20 : 40;
        doc.setFontSize(16);
        doc.text(t('pages.bookings.flightBookings'), 14, startY);

        const flightData = flightBookings.map(booking => {
          const data = formatBookingData(booking);
          return [
            data.id,
            data.status,
            data.airline,
            data.flightNumber,
            data.from,
            data.to,
            data.date,
            data.passengers.toString(),
            data.amount,
            data.bookingDate,
          ];
        });

        (doc as any).autoTable({
          startY: startY + 5,
          head: [[t('common.id'), t('common.status'), t('common.airline'), t('common.flight'), t('common.from'), t('common.to'), t('common.date'), t('pages.flights.passengers'), t('common.amount'), t('pages.bookings.bookingDate')]],
          body: flightData,
        });
      }

      doc.save('bookings-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('errors.failedToGeneratePdfReport'));
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    setLoading(true);
    try {
      const data = bookings.map(formatBookingData);
      const csv = Papa.unparse(data);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'bookings-report.csv');
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert(t('errors.failedToGenerateCsvReport'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={exportToPDF}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Download className="w-5 h-5 mr-2" />
        {t('common.exportToPdf')}
      </button>
      
      <button
        onClick={exportToCSV}
        disabled={loading}
        className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Download className="w-5 h-5 mr-2" />
        {t('common.exportToCsv')}
      </button>
    </div>
  );
}
