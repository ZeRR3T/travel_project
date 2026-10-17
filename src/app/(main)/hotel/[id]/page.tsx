'use client';

import { useEffect, useState } from 'react';
import { Star, Wifi, ParkingSquare, Utensils, MapPin } from 'lucide-react';
import { BookingForm } from '@/components/BookingForm';
import { Header } from '@/components/Header';
import { useI18n } from '@/i18n/context/I18nContext';

interface HotelDetails {
  name: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  checkIn?: string;
  checkOut?: string;
  hotelClass?: string;
  amenities: string[];
  nearbyPlaces?: string[];
}

export default function HotelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    // Handle the Promise params in useEffect
    const getHotelId = async () => {
      try {
        const { id } = await params;
        setHotelId(id);
        
        console.log(' Looking for hotel with ID:', id);
        console.log(' All sessionStorage keys:', Object.keys(sessionStorage));
        
        // Get hotel data from sessionStorage
        const hotelData = sessionStorage.getItem(`hotel_${id}`);
        if (hotelData) {
          try {
            const parsedHotel = JSON.parse(hotelData);
            console.log(' Found hotel data:', parsedHotel);
            setHotel(parsedHotel);
          } catch (error) {
            console.error(' Error parsing hotel data:', error);
          }
        } else {
          console.log(' No hotel data found in sessionStorage for ID:', id);
          
          // Try to find any hotel data
          const allKeys = Object.keys(sessionStorage);
          const hotelKeys = allKeys.filter(key => key.startsWith('hotel_'));
          console.log(' Available hotel keys:', hotelKeys);
          
          if (hotelKeys.length > 0) {
            console.log(' Sample hotel data:', sessionStorage.getItem(hotelKeys[0]));
          }
        }
      } catch (error) {
        console.error(' Error getting hotel ID:', error);
      } finally {
        setLoading(false);
      }
    };

    getHotelId();
  }, [params]);

  if (loading) {
    return (
      <>
        <Header title={t('pages.hotels.title')} />
        <div className="text-center p-10">{t('pages.hotels.loading')}</div>
      </>
    );
  }

  if (!hotel) {
    return (
      <>
        <Header title={t('pages.hotels.title')} />
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{t('pages.hotels.notFound')}</h2>
          <p className="text-slate-800 mb-4">
            {t('pages.hotels.couldNotFind')} <code className="bg-gray-100 px-2 py-1 rounded">{hotelId}</code>
          </p>
          
          {/* Debug information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-slate-800 mb-2">{t('pages.hotels.debugInfo')}:</h3>
            <p className="text-sm text-slate-700 mb-2">
              <strong>{t('pages.hotels.hotelId')}:</strong> {hotelId}
            </p>
            <p className="text-sm text-slate-700 mb-2">
              <strong>{t('pages.hotels.sessionStorageKeys')}:</strong> {Object.keys(sessionStorage).filter(key => key.startsWith('hotel_')).join(', ')}
            </p>
            <p className="text-sm text-slate-700 mb-2">
              <strong>{t('pages.hotels.totalSessionStorageKeys')}:</strong> {Object.keys(sessionStorage).length}
            </p>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => window.history.back()}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
              ← {t('pages.hotels.backToSearch')}
            </button>
            
            <button 
              onClick={() => window.location.href = '/search'}
              className="block mx-auto mt-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('pages.hotels.goToSearchPage')}
            </button>
          </div>
        </div>
      </>
    );
  }

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('интернет')) {
      return <Wifi className="w-5 h-5 text-blue-600" />;
    }
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('парковка')) {
      return <ParkingSquare className="w-5 h-5 text-green-600" />;
    }
    if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('ресторан') || lowerAmenity.includes('food')) {
      return <Utensils className="w-5 h-5 text-orange-600" />;
    }
    return <Star className="w-5 h-5 text-gray-600" />;
  };

  // Helper function to safely render text content
  const safeText = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // If it's an object with a name property, use that
      if (value.name) return value.name;
      // Otherwise, try to stringify it safely
      try {
        return JSON.stringify(value);
      } catch {
        return 'Complex data';
      }
    }
    return String(value);
  };

  // Helper function to safely render array content
  const safeArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    return [];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <img 
          src={safeText(hotel.image)} 
          alt={safeText(hotel.name)} 
          className="w-full h-64 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/800x400?text=Hotel+Image';
          }}
        />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">{safeText(hotel.name)}</h1>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="w-6 h-6 text-yellow-500 mr-2" />
                <span className="text-xl font-semibold">{safeText(hotel.rating)}</span>
                <span className="text-slate-500 ml-2">({safeText(hotel.reviews)} reviews)</span>
              </div>
              {hotel.hotelClass && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {safeText(hotel.hotelClass)}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-600">{safeText(hotel.price)}</p>
              <p className="text-slate-500 text-sm">per night</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">About this hotel</h2>
            <p className="text-slate-700 leading-relaxed text-lg">{safeText(hotel.description)}</p>
          </div>

          {hotel.checkIn && hotel.checkOut && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-3">Check-in/Check-out</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-600 text-sm">Check-in</p>
                  <p className="font-semibold">{safeText(hotel.checkIn)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-600 text-sm">Check-out</p>
                  <p className="font-semibold">{safeText(hotel.checkOut)}</p>
                </div>
              </div>
            </div>
          )}

          {hotel.amenities && safeArray(hotel.amenities).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-3">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {safeArray(hotel.amenities).map((amenity, index) => (
                  <div key={index} className="flex items-center p-3 bg-slate-50 rounded-lg">
                    {getAmenityIcon(safeText(amenity))}
                    <span className="ml-2 text-slate-700">{safeText(amenity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hotel.location && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-3">Location</h2>
              <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-slate-700">
                  {hotel.location.address ? safeText(hotel.location.address) : 
                   `${safeText(hotel.location.latitude)}, ${safeText(hotel.location.longitude)}`}
                </span>
              </div>
            </div>
          )}

          {hotel.nearbyPlaces && safeArray(hotel.nearbyPlaces).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-3">Nearby Places</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {safeArray(hotel.nearbyPlaces).map((place, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {safeText(place)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <button 
                  onClick={() => window.history.back()}
                  className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  ← Back to search
                </button>
              </div>
              <div>
                <BookingForm
                  hotelId={hotelId || ''}
                  hotelName={hotel.name}
                  pricePerNight={parseFloat(hotel.price.replace(/[^0-9.]/g, ''))}
                  checkIn={hotel.checkIn}
                  checkOut={hotel.checkOut}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 