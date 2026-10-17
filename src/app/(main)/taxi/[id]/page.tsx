'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Car, Star, MapPin, ArrowLeft, ExternalLink, DollarSign, Clock, Phone, Shield, Navigation, Zap } from 'lucide-react';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';

interface TaxiServiceDetail {
  name: string;
  description?: string;
  price?: string;
  rating?: number;
  image: string;
  link: string;
  location: string;
}

export default function TaxiServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [taxiService, setTaxiService] = useState<TaxiServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTaxiData = async () => {
      try {
        const taxiId = await params.id;
        console.log(' Loading taxi service with ID:', taxiId);
        
        const storageKey = `taxi_${taxiId}`;
        const savedData = sessionStorage.getItem(storageKey);
        
        console.log(' Looking for taxi with key:', storageKey);
        console.log(' Available sessionStorage keys:', Object.keys(sessionStorage));
        
        if (savedData) {
          const taxiData = JSON.parse(savedData);
          console.log(' Found taxi data:', taxiData);
          setTaxiService(taxiData);
        } else {
          console.log(' Taxi data not found');
        }
      } catch (error) {
        console.error(' Error loading taxi data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTaxiData();
  }, [params.id]);

  if (loading) {
    return (
      <>
        <Header title={t('pages.taxi.title')} />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
          <div className="text-center">
            <Car className="w-12 h-12 text-yellow-600 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-800">{t('pages.taxi.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (!taxiService) {
    const taxiId = params.id;
    return (
      <>
        <Header title={t('pages.taxi.title')} />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('pages.taxi.notFound')}</h2>
            <p className="text-slate-800 mb-4">
              {t('pages.taxi.couldNotFind')} <code className="bg-gray-100 px-2 py-1 rounded">{taxiId}</code>
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-2xl mx-auto">
              <h3 className="font-semibold text-slate-800 mb-2">{t('pages.taxi.debugInfo')}:</h3>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.taxi.taxiId')}:</strong> {taxiId}
              </p>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.taxi.sessionStorageKeys')}:</strong> {Object.keys(sessionStorage).filter(key => key.startsWith('taxi_')).join(', ')}
              </p>
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('pages.taxi.totalSessionStorageKeys')}:</strong> {Object.keys(sessionStorage).length}
              </p>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.history.back()}
                className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
              >
                ← {t('pages.taxi.backToSearch')}
              </button>
              <button 
                onClick={() => window.location.href = '/search'}
                className="block mx-auto mt-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {t('pages.taxi.goToSearchPage')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full px-4"> {/* Адаптивные отступы и скрытие сайдбара на мобильных */}
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">{t('pages.taxi.backToSearch')}</span>
            <span className="sm:hidden">{t('pages.taxi.back')}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Image */}
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
            <img
              src={taxiService.image}
              alt={taxiService.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <a
                href={taxiService.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{t('pages.taxi.callTaxi')}</span>
                <span className="sm:hidden">{t('pages.taxi.call')}</span>
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4 gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 break-words">{taxiService.name}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm sm:text-base">{taxiService.location}</span>
                  </div>
                  {taxiService.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-sm sm:text-base">{taxiService.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              {taxiService.price && (
                <div className="text-right">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{taxiService.price}</p>
                  <p className="text-xs sm:text-sm text-slate-600">{t('pages.taxi.perTrip')}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {taxiService.description && (
              <div className="mb-6">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 mb-3">{t('pages.taxi.serviceDescription')}</h2>
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{taxiService.description}</p>
              </div>
            )}

            {/* Features - адаптивная сетка */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                <Car className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.taxi.taxi')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.taxi.service')}</p>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.taxi.rate')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.taxi.byMeter')}</p>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.taxi.availability')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.taxi.twentyFourSeven')}</p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t('pages.taxi.safety')}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{t('pages.taxi.licensedDrivers')}</p>
              </div>
            </div>

            {/* Service Features */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">{t('pages.taxi.serviceFeatures')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>{t('pages.taxi.phoneBooking')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
                  <Navigation className="w-4 h-4 text-green-600" />
                  <span>{t('pages.taxi.gpsTracking')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span>{t('pages.taxi.quickPickup')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>{t('pages.taxi.insurance')}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <a
                href={taxiService.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-3 md:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base md:text-lg w-full sm:w-auto justify-center"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{t('pages.taxi.orderTaxi')}</span>
                <span className="sm:hidden">{t('pages.taxi.callTaxi')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 