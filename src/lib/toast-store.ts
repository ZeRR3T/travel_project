'use client';

import { create } from 'zustand';

type ToastState = {
  message: string | null;
  type: 'success' | 'error' | 'info';
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  showBookingSuccess: (bookingType: 'hotel' | 'flight' | 'car' | 'taxi') => void;
};

const bookingMessages = {
  hotel: 'Hotel booking completed successfully! Your reservation has been confirmed.',
  flight: 'Flight booking completed successfully! Your ticket has been confirmed.',
  car: 'Car rental booking completed successfully! Your reservation has been confirmed.',
  taxi: 'Taxi service booking completed successfully! Your ride has been confirmed.',
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type) => set({ message, type }),
  hideToast: () => set({ message: null }),
  showBookingSuccess: (bookingType) => set({ 
    message: bookingMessages[bookingType], 
    type: 'success' 
  }),
}));

// Экспортируем функцию для удобного использования
export const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  useToastStore.getState().showToast(message, type);
};

// Экспортируем функцию для уведомлений о бронировании
export const showBookingSuccess = (bookingType: 'hotel' | 'flight' | 'car' | 'taxi') => {
  useToastStore.getState().showBookingSuccess(bookingType);
};
