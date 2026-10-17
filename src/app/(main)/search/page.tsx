'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Plane, Building2, Car, Palmtree, Info, Star, Utensils, Sparkles, ArrowRight, MapPin, Search, Mic, X, Globe, Calendar, Users, TrendingUp } from 'lucide-react';
import { VoiceSearch } from '@/components/VoiceSearch';
import Link from 'next/link';
import { FlightBookingForm } from '@/components/FlightBookingForm';
import { useI18n } from '@/i18n/context/I18nContext';
import { Header } from '@/components/Header';
import { getCarRentalSearchUrl } from '@/lib/search-utils';

// Interfaces for actual search results
interface FlightResult {
  price: string;
  duration: string;
  airline: string;
  logo: string;
  departure: { time: string; airport: string };
  arrival: { time: string; airport: string };
  bookingLink: string;
}

interface HotelResult {
  name: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  link: string;
}

interface RestaurantResult {
  name: string;
  description?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  address?: string;
  image: string;
  link: string;
}

interface CarRentalResult {
  name: string;
  description?: string;
  price?: string;
  rating?: number;
  image: string;
  link: string;
  location: string;
}

interface TaxiServiceResult {
  name: string;
  description?: string;
  price?: string;
  rating?: number;
  image: string;
  link: string;
  location: string;
}

interface SearchResult {
  summary?: any;
  hotels?: any[];
  flights?: any[];
  restaurants?: RestaurantResult[];
  carRentals?: CarRentalResult[];
  taxiServices?: TaxiServiceResult[];
}

// New Component for AI Summary and Recommendations with Enhanced Animations
const TripSummaryCard = ({ summary, recommendations }: { summary: string, recommendations: any }) => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-[2rem] p-6 text-white shadow-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 animate-pulse"></div>
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg transition-all duration-300 hover:scale-110">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold ml-3">{t('pages.aiSearch.aiTripOverview')}</h3>
        </div>
        <p className="text-slate-200 leading-relaxed">{summary}</p>
      </div>
      {recommendations?.restaurants && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="flex items-center mb-2">
            <Utensils className="w-5 h-5 text-emerald-400 mr-2 transition-transform duration-300 hover:rotate-12" />
            <h4 className="font-semibold text-slate-100">{t('pages.aiSearch.restaurantRecommendations')}</h4>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{recommendations.restaurants}</p>
        </div>
      )}

      {recommendations?.activities && (
        <div className="mt-3">
          <div className="flex items-center mb-2">
            <Palmtree className="w-5 h-5 text-emerald-400 mr-2 transition-transform duration-300 hover:rotate-12" />
            <h4 className="font-semibold text-slate-100">{t('pages.aiSearch.activitySuggestions')}</h4>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{recommendations.activities}</p>
        </div>
      )}
    </div>
  );
};

// Result Display Components with Enhanced Animations
const FlightResults = ({ flights, summary }: { flights: any[], summary?: any }) => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="flex items-center">
        <div className="p-2 bg-blue-900/30 rounded-lg mr-3 transition-all duration-300 hover:scale-110">
          <Plane className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">{t('pages.aiSearch.availableFlights')}</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {flights.map((flight, index) => {          const summaryFlights = summary?.flights?.[0];
          const flightDate = flight.tripType === 'return' ? summaryFlights?.returnDate : summaryFlights?.date;

          const flightWithDate = {
            ...flight,
            price: parseFloat(flight.price) || 0,
            flightDate: flightDate,
          };
          return (
            <div
              key={index}
              className={`group bg-slate-800/90 backdrop-blur-md rounded-[2rem] shadow-2xl border-2 border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-700 hover:-translate-y-2 hover:scale-105 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${index * 150}ms`
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors duration-300">{flight.airline}</h4>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">${flight.price}</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="font-bold text-lg text-white">{flight.departure.airport}</p>
                    <p className="text-lg text-slate-300 font-medium">{flight.departure.time}</p>
                    {flightWithDate.flightDate && (
                      <p className="text-sm text-slate-400 mt-1">
                        {flight.tripType === 'return' ? t('pages.aiSearch.return') + ': ' : t('pages.aiSearch.departure') + ': '}                        {flightWithDate.flightDate}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex-1 mx-6 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300 group-hover:w-16"></div>
                      <Plane className="w-5 h-5 text-blue-400 mx-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                      <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300 group-hover:w-16"></div>
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{flight.duration}</span>
                    <div className="mt-2">
                      {flight.stops === 0 ? (
                        <span className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105">
                          {t('pages.aiSearch.direct')}
                        </span>
                      ) : (
                        <span className="bg-orange-900/30 text-orange-300 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-105">
                          {flight.stops} {flight.stops > 1 ? t('pages.aiSearch.stops') : t('pages.aiSearch.stop')}                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-bold text-lg text-white">{flight.arrival.airport}</p>
                    <p className="text-lg text-slate-300 font-medium">{flight.arrival.time}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full mr-2 transition-all duration-300 group-hover:scale-150"></div>
                    {flight.aircraft}
                  </span>
                  <span className="capitalize bg-slate-700 px-3 py-1 rounded-full transition-all duration-300 group-hover:bg-blue-900/30 group-hover:text-blue-300">{flight.cabinClass}</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-slate-700 to-slate-800 border-t border-slate-600">
                <FlightBookingForm 
                  flightNumber={flight.flightNumber || `FL-${index + 1}`}
                  airline={flight.airline}
                  departure={{
                    city: flight.departure.city || flight.departure.airport,
                    date: flightWithDate.flightDate || '2024-01-01',
                    time: flight.departure.time
                  }}
                  arrival={{
                    city: flight.arrival.city || flight.arrival.airport,
                    date: flightWithDate.flightDate || '2024-01-01',
                    time: flight.arrival.time
                  }}
                  price={flight.price}
                  passengers={1}
                  cabinClass={flight.cabinClass || 'economy'}
                />              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HotelResults = ({ hotels }: { hotels: any[] }) => {
  const { t } = useI18n();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleHotelClick = (hotel: any) => {
    const hotelId = hotel.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const storageKey = `hotel_${hotelId}`;
    sessionStorage.setItem(storageKey, JSON.stringify(hotel));
    router.push(`/hotel/${hotelId}`);
  };

  return (
    <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="flex items-center">
        <div className="p-2 bg-emerald-900/30 rounded-lg mr-3 transition-all duration-300 hover:scale-110">
          <Building2 className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">{t('pages.aiSearch.recommendedHotels')}</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {hotels.map((hotel, index) => (
          <button 
            onClick={() => handleHotelClick(hotel)} 
            key={index} 
            className={`group text-left bg-slate-800/90 backdrop-blur-md rounded-[2rem] shadow-2xl border-2 border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-700 hover:-translate-y-2 hover:scale-105 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{
              transitionDelay: `${index * 150}ms`
            }}
          >
            <div className="relative overflow-hidden">
              <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg transition-all duration-300 group-hover:scale-110">
                <span className="text-lg font-bold text-emerald-400">{hotel.price}</span>
              </div>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-xl text-white mb-3 group-hover:text-blue-400 transition-colors duration-300">{hotel.name}</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center bg-yellow-900/30 px-3 py-1 rounded-full transition-all duration-300 group-hover:scale-105">
                    <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
                    <span className="font-semibold text-white">{hotel.rating}</span>
                  </div>
                  <span className="text-sm text-slate-400 ml-3">({hotel.reviews} reviews)</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CarRentalCard = ({ carRental }: { carRental: any }) => {
  const { t } = useI18n();
  return (
  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
    <div className="flex items-center mb-2">
      <Car className="w-5 h-5 mr-2 text-slate-300" />
              <h3 className="font-bold text-white">{t('pages.aiSearch.carRental')}</h3>
    </div>
          <p className="text-slate-300"><strong>{t('pages.aiSearch.pickup')}:</strong> {carRental.pickup}</p>
      <p className="text-slate-300"><strong>{t('pages.aiSearch.dropoff')}:</strong> {carRental.dropoff}</p>
      <p className="text-slate-300"><strong>{t('pages.aiSearch.timing')}:</strong> {carRental.timing}</p>
  </div>
  );
};

const ActivitiesCard = ({ activities }: { activities: any }) => {
  const { t } = useI18n();
  return (
  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
    <div className="flex items-center mb-2">
      <Palmtree className="w-5 h-5 mr-2 text-slate-300" />
              <h3 className="font-bold text-white">{t('pages.aiSearch.activities')}</h3>
    </div>
          {activities.business && <p className="text-slate-300"><strong>{t('pages.aiSearch.business')}:</strong> {activities.business}</p>}
      {activities.leisure && <p className="text-slate-300"><strong>{t('pages.aiSearch.leisure')}:</strong> {activities.leisure}</p>}
  </div>
  );
};

const DietaryNeedsCard = ({ dietaryNeeds }: { dietaryNeeds: { [key: string]: string } }) => {
  const { t } = useI18n();
  return (
  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
    <div className="flex items-center mb-2">
      <Info className="w-5 h-5 mr-2 text-red-400" />
              <h3 className="font-bold text-red-300">{t('pages.aiSearch.importantNotes')}</h3>
    </div>
    {Object.entries(dietaryNeeds).map(([person, need]) => (
      <p key={person} className="text-red-300"><strong>{person}:</strong> {need}</p>
    ))}
  </div>
  );
};

const RestaurantResults = ({ restaurants }: { restaurants: RestaurantResult[] }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-6 h-6 text-orange-600" />
        <h3 className="text-xl font-bold text-white">{t('pages.aiSearch.restaurants')} ({restaurants.length})</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {restaurants.map((restaurant, index) => (
                     <a href={restaurant.link} target="_blank" rel="noopener noreferrer" key={index} className="block text-left bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300">
            <img 
              src={restaurant.image} 
              alt={restaurant.name} 
              className="w-full h-40 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbackImages = [
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=400&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop&crop=center',
                  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=400&fit=crop&crop=center'
                ];
                const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
                target.src = randomFallback;
              }}
            />
            <div className="p-4">
              <h4 className="font-bold truncate text-white">{restaurant.name}</h4>
              <p className="text-sm text-slate-300 mt-1">{restaurant.description || ''}</p>
                              <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold text-white">{restaurant.rating || 'N/A'}</span>
                    <span className="text-sm text-slate-400 ml-2">({restaurant.reviews || 0} {t('pages.aiSearch.reviews')})</span>
                  </div>
                  {restaurant.price && (
                    <p className="font-bold text-lg text-green-400">{restaurant.price}</p>
                  )}
                </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};



const CarRentalResults = ({ carRentals, onCarRentalClick }: { carRentals: CarRentalResult[], onCarRentalClick: (carRental: any) => void }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-white">{t('pages.aiSearch.carRentals')} ({carRentals.length})</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {carRentals.map((car, index) => (
                     <div 
             key={index} 
             onClick={() => onCarRentalClick(car)}
             className="cursor-pointer text-left bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300"
          >
            <img 
              src={car.image} 
              alt={car.name} 
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h4 className="font-bold truncate text-white">{car.name}</h4>
              <p className="text-sm text-slate-300 mt-1">{car.description || ''}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  {car.rating && (
                    <>
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold text-white">{car.rating}</span>
                    </>
                  )}
                </div>
                {car.price && (
                  <p className="font-bold text-lg text-green-400">{car.price}</p>
                )}
              </div>
              <div className="flex items-center mt-2">
                <MapPin className="w-4 h-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">{car.location}</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-600">
                <span className="text-xs text-blue-400 font-medium">{t('pages.aiSearch.visitOfficialWebsite')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TaxiServiceResults = ({ taxiServices, onTaxiClick }: { taxiServices: TaxiServiceResult[], onTaxiClick: (taxi: any) => void }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="w-6 h-6 text-yellow-600" />
        <h3 className="text-xl font-bold text-white">{t('pages.aiSearch.taxiServices')} ({taxiServices.length})</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {taxiServices.map((taxi, index) => (
                     <div 
             key={index}
             onClick={() => onTaxiClick(taxi)}
             className="cursor-pointer text-left bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden hover:shadow-3xl transition-all duration-300"
          >
            <img 
              src={taxi.image} 
              alt={taxi.name} 
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h4 className="font-bold truncate text-white">{taxi.name}</h4>
              <p className="text-sm text-slate-300 mt-1">{taxi.description || ''}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  {taxi.rating && (
                    <>
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="font-semibold text-white">{taxi.rating}</span>
                    </>
                  )}
                </div>
                {taxi.price && (
                  <p className="font-bold text-lg text-green-400">{taxi.price}</p>
                )}
              </div>
              <div className="flex items-center mt-2">
                <MapPin className="w-4 h-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-400">{taxi.location}</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-600">
                <span className="text-xs text-yellow-400 font-medium">{t('pages.aiSearch.clickForDetails')}</span>              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDietaryNotes, setShowDietaryNotes] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const [travelDate, setTravelDate] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handlers for car rental and taxi clicks
  const handleCarRentalClick = (carRental: any) => {
    // Перенаправляем на Google поиск
    const searchUrl = getCarRentalSearchUrl(carRental.name, carRental.location);
    window.open(searchUrl, '_blank');
  };

  const handleTaxiClick = (taxi: any) => {
    // Если есть прямая ссылка на сайт такси, перенаправляем на неё
    if (taxi.link && taxi.link !== '#' && !taxi.link.includes('dev.by.team')) {
      window.open(taxi.link, '_blank');
      return;
    }

    // Если нет прямой ссылки, генерируем поисковый запрос Google
    const searchQuery = `${taxi.name} taxi service ${taxi.location}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleSearchUrl, '_blank');
  };

  // Load saved search data on component mount
  useEffect(() => {
    const savedQuery = sessionStorage.getItem('lastSearchQuery');
    const savedResult = sessionStorage.getItem('lastSearchResult');
    
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
    
    if (savedResult) {
      try {
        const parsedResult = JSON.parse(savedResult);
        setResult(parsedResult);

        // Re-populate dates from saved result to persist them on reload
        const summaryFlights = parsedResult?.summary?.flights;
        const travelDateFromStorage = summaryFlights?.date || parsedResult?.hotels?.[0]?.checkIn || null;
        const returnDateFromStorage = summaryFlights?.returnDate || null;
        
        setTravelDate(travelDateFromStorage);
        setReturnDate(returnDateFromStorage);

      } catch (error) {
        console.error('Error parsing saved search result:', error);
      }
    }
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError('');
    setResult(null);
    setDestination(null);
    setTravelDate(null);
    setReturnDate(null);

    try {
      const response = await fetch('/api/unified-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      console.log(' Search results:', data);
      
      // Подробное логирование структуры данных
      console.log(' Flights structure:', {
        hasFlights: !!data.flights,
        flightsLength: data.flights?.length,
        firstFlight: data.flights?.[0],
        summaryFlights: data.summary?.flights, // Log summary for debugging
        firstFlightArrival: data.flights?.[0]?.arrival,
        firstFlightDeparture: data.flights?.[0]?.departure
      });
      
      console.log(' Hotels structure:', {
        hasHotels: !!data.hotels,
        hotelsLength: data.hotels?.length,
        firstHotel: data.hotels?.[0]
      });

      // Извлекаем город назначения и дату для погоды
      // Определяем город назначения
      let destination = null;
      
      // Пробуем получить город из данных о полете
      if (data?.flights?.[0]?.arrival?.city) {
        destination = data.flights[0].arrival.city;
      }
      // Если нет, пробуем получить из данных об отеле
      else if (data?.hotels?.[0]?.location) {
        destination = data.hotels[0].location;
      }
      // Если все еще нет, проверяем аэропорт прибытия
      else if (data?.flights?.[0]?.arrival?.airport) {
        // Если это один из аэропортов Нью-Йорка
        if (['JFK', 'LaGuardia', 'Newark'].some(code => 
            data.flights[0].arrival.airport.includes(code))) {
          destination = 'New York City';
        }
      }
      
      const summaryFlights = data?.summary?.flights;
      const travelDate = summaryFlights?.date || data?.hotels?.[0]?.checkIn || null;
      const returnDate = summaryFlights?.returnDate || null;

      console.log(' Extracted weather data:', {
        destination, 
        travelDate,
        returnDate,
        destinationSource: destination ? 
          (data?.flights?.[0]?.arrival?.city ? 'flights.arrival.city' : 
           data?.hotels?.[0]?.location ? 'hotels.location' : 
           'flights.arrival.airport.name') : 'null'
      });

      console.log(' Setting weather data:', { cityForWeather: destination, dateForWeather: travelDate });
      setDestination(destination);
      setTravelDate(travelDate);
      setReturnDate(returnDate);

      setResult(data);
      // Save search data to sessionStorage
      sessionStorage.setItem('lastSearchQuery', query);
      sessionStorage.setItem('lastSearchResult', JSON.stringify(data));
    } catch (err: any) {
      console.error(' Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  // Handler for voice search results
  const handleVoiceResult = (voiceResult: any) => {
    if (voiceResult?.to) {
      console.log(' Voice result received:', voiceResult.to);
      setSearchQuery(voiceResult.to);
      // Automatically trigger search after receiving voice input
      handleSearch(voiceResult.to);
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    setResult(null);
    setError('');
    // Remove saved search data
    sessionStorage.removeItem('lastSearchQuery');
    sessionStorage.removeItem('lastSearchResult');
  };

  return (
    <>
      <Header title={t('pages.aiSearch.title')} />
             <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section with Enhanced Animations */}
            <div className={`text-center mb-12 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-3xl mb-6 shadow-3xl transition-all duration-500 hover:scale-110 hover:shadow-2xl">
                <Bot className="w-10 h-10 text-white transition-transform duration-300 hover:rotate-12" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                {t('pages.aiSearch.aiTravelPlanner')}
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                  {t('pages.aiSearch.description')}
              </p>
            </div>

            {/* Search Form with Enhanced Animations */}
            <div className={`bg-slate-800/80 backdrop-blur-lg p-8 rounded-[2rem] shadow-3xl border-4 border-slate-700/50 mb-12 transition-all duration-1000 delay-400 hover:shadow-2xl ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <form onSubmit={handleFormSubmit}>
                <div className="relative group">
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('pages.aiSearch.placeholder')}
                    className="w-full h-32 p-6 pr-16 text-white bg-slate-700/50 border-2 border-slate-600 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-lg group-hover:border-blue-400 placeholder-slate-400"
                    disabled={isLoading}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <VoiceSearch onResult={handleVoiceResult} />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {result && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-all duration-300 hover:scale-105 group"
                      >
                        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        {t('common.clear')}
                      </button>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-rose-500 text-white px-8 py-4 rounded-2xl hover:from-amber-600 hover:to-rose-600 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                    disabled={isLoading}
                  >
                    {isLoading ? t('pages.aiSearch.planning') : t('pages.aiSearch.planTrip')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Error Display with Enhanced Animations */}
            {error && (
              <div className={`mb-8 bg-red-900/20 border-2 border-red-700/50 text-red-300 p-6 rounded-2xl transition-all duration-500 animate-pulse ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <p className="text-lg font-medium">{error}</p>
              </div>
            )}

            {/* Loading State with Enhanced Animations */}
            {isLoading && (
              <div className={`text-center py-16 transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full mb-4 animate-pulse">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <p className="text-xl text-slate-300 font-medium">{t('pages.aiSearch.aiPlanning')}</p>
              </div>
            )}

            {/* Results with Enhanced Animations */}
            {result && (
              <div className={`space-y-12 transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>                {result.flights && result.flights.length > 0 && <FlightResults flights={result.flights} summary={result.summary} />}
                {result.hotels && result.hotels.length > 0 && <HotelResults hotels={result.hotels} />}
                {result.restaurants && result.restaurants.length > 0 && <RestaurantResults restaurants={result.restaurants} />}
                {result.carRentals && result.carRentals.length > 0 && <CarRentalResults carRentals={result.carRentals} onCarRentalClick={handleCarRentalClick} />}
                {result.taxiServices && result.taxiServices.length > 0 && <TaxiServiceResults taxiServices={result.taxiServices} onTaxiClick={handleTaxiClick} />}
                
                {/* Summary cards for other details */}
                {result.summary?.carRental?.needed && <CarRentalCard carRental={result.summary.carRental} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
