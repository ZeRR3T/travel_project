'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Car, Star, MapPin, ArrowLeft, ExternalLink, DollarSign, Clock, Users, Fuel } from 'lucide-react';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';
import { getCarRentalSearchUrl } from '@/lib/search-utils';

interface CarRentalDetail {
  name: string;
  description?: string;
  price?: string;
  rating?: number;
  image: string;
  link: string;
  location: string;
}

export default function CarRentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [carRental, setCarRental] = useState<CarRentalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCarRentalData = async () => {
      try {
        const carRentalId = await params.id;
        console.log(' Loading car rental with ID:', carRentalId);
        
        const storageKey = `car_rental_${carRentalId}`;
        const savedData = sessionStorage.getItem(storageKey);
        
        console.log(' Looking for car rental with key:', storageKey);
        console.log(' Available sessionStorage keys:', Object.keys(sessionStorage));
        
        if (savedData) {
          const carRentalData = JSON.parse(savedData);
          console.log(' Found car rental data:', carRentalData);
          setCarRental(carRentalData);
        } else {
          console.log(' Car rental data not found');
        }
      } catch (error) {
        console.error(' Error loading car rental data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCarRentalData();
  }, [params.id]);

  const handleBooking = () => {
    if (!carRental) return;

    // Если есть прямая ссылка на сайт компании, используем её
    if (carRental.link && carRental.link.startsWith('http')) {
      window.open(carRental.link, '_blank');
      return;
    }

    // Иначе ищем через Google
    const searchUrl = getCarRentalSearchUrl(carRental.name, carRental.location);
    window.open(searchUrl, '_blank');
  };

  if (loading) {
    return (
      <>
        <Header title={t('pages.carRental.title')} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <Car className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-800">{t('pages.carRental.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (!carRental) {
    const carRentalId = params.id;
    return (
      <>
        <Header title={t('pages.carRental.title')} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('pages.carRental.notFound')}</h2>
            <p className="text-slate-800 mb-4">
              {t('pages.carRental.couldNotFind')} <code className="bg-gray-100 px-2 py-1 rounded">{carRentalId}</code>
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-2xl mx-auto">
              <h3 className="font-semibold text-slate-800 mb-2">{t('pages.carRental.debugInfo')}:</h3>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.carRental.carRentalId')}:</strong> {carRentalId}
              </p>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.carRental.sessionStorageKeys')}:</strong> {Object.keys(sessionStorage).filter(key => key.startsWith('car_rental_')).join(', ')}
              </p>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.carRental.totalSessionStorageKeys')}:</strong> {Object.keys(sessionStorage).length}
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.history.back()}
                className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                ← {t('pages.carRental.backToSearch')}
              </button>
              <button 
                onClick={() => window.location.href = '/search'}
                className="block mx-auto mt-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('pages.carRental.goToSearchPage')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br">
      <div className="w-full px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t('pages.carRental.backToSearch')}</span>
            <span className="sm:hidden">{t('pages.carRental.back')}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Image */}
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
            <img
              src={carRental.image}
              alt={carRental.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <button
                onClick={handleBooking}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{t('pages.carRental.bookNow')}</span>
                <span className="sm:hidden">{t('pages.carRental.book')}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">{carRental.name}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm sm:text-base">{carRental.location}</span>
                  </div>
                  {carRental.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-sm sm:text-base">{carRental.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              {carRental.price && (
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{carRental.price}</p>
                  <p className="text-xs sm:text-sm text-slate-600">{t('pages.carRental.perDay')}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {carRental.description && (
              <div className="mb-6">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 mb-3">{t('pages.carRental.description')}</h2>
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{carRental.description}</p>
              </div>
            )}

            {/* Features - адаптивная сетка */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                <Car className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.carRental.rental')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.carRental.vehicle')}</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.carRental.price')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{carRental.price || t('pages.carRental.uponRequest')}</p>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.carRental.availability')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.carRental.twentyFourSeven')}</p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.carRental.location')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{carRental.location}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={handleBooking}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-3 md:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base md:text-lg w-full sm:w-auto justify-center"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{t('pages.carRental.goToBooking')}</span>
                <span className="sm:hidden">{t('pages.carRental.bookNow')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}