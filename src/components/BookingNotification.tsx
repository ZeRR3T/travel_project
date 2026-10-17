'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Plane, Hotel, Car, Phone, X } from 'lucide-react';

interface BookingNotificationProps {
  type: 'hotel' | 'flight' | 'car' | 'taxi';
  isVisible: boolean;
  onClose: () => void;
}

const bookingMessages = {
  hotel: {
    title: 'Hotel Booking Confirmed!',
    message: 'Your hotel reservation has been successfully confirmed. Check your email for details.',
    icon: Hotel,
    color: 'bg-blue-500',
  },
  flight: {
    title: 'Flight Booking Confirmed!',
    message: 'Your flight ticket has been successfully confirmed. Check your email for details.',
    icon: Plane,
    color: 'bg-green-500',
  },
  car: {
    title: 'Car Rental Confirmed!',
    message: 'Your car rental has been successfully confirmed. Check your email for details.',
    icon: Car,
    color: 'bg-purple-500',
  },
  taxi: {
    title: 'Taxi Service Confirmed!',
    message: 'Your taxi service has been successfully confirmed. Check your email for details.',
    icon: Phone,
    color: 'bg-yellow-500',
  },
};

export function BookingNotification({ type, isVisible, onClose }: BookingNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const bookingInfo = bookingMessages[type];
  const IconComponent = bookingInfo.icon;

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] animate-in slide-in-from-right-2 duration-300">
      <div className={`${bookingInfo.color} text-white p-4 rounded-lg shadow-lg min-w-[350px] max-w-[450px]`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{bookingInfo.title}</h3>
            <p className="text-sm opacity-90">{bookingInfo.message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
