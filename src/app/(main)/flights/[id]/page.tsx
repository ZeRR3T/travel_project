'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { FlightBookingForm } from '@/components/FlightBookingForm';
import { useI18n } from '@/i18n/context/I18nContext';
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Briefcase,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface Flight {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  price: string;
  totalPrice?: string;
  passengers?: number;
  stops: number;
  aircraft?: string;
  cabinClass?: string;
  baggage?: string;
  refundable?: boolean;
  warning?: string;
  link?: string;
}

export default function FlightDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFlight = () => {
      try {
        const storedFlight = sessionStorage.getItem('selectedFlight');
        if (storedFlight) {
          const flightData = JSON.parse(storedFlight);
          setFlight(flightData);
        } else {
          setError(t('pages.flights.dataNotFound'));
        }
      } catch (err) {
        setError(t('pages.flights.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [t]);

  const handleBack = () => {
    // Navigate back to flights page - the search results will be restored automatically
    router.push('/flights');
  };

  const getCabinClassIcon = (classType: string) => {
    switch (classType) {
      case 'economy':
        return <Star className="w-6 h-6 text-blue-500" />;
      case 'business':
        return <Briefcase className="w-6 h-6 text-green-500" />;
      case 'first':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return <Star className="w-6 h-6 text-blue-500" />;
    }
  };

  const getCabinClassLabel = (classType: string) => {
    switch (classType) {
      case 'economy':
        return t('pages.flights.economy');
      case 'business':
        return t('pages.flights.business');
      case 'first':
        return t('pages.flights.first');
      default:
        return t('pages.flights.economy');
    }
  };

  const getCabinClassColor = (classType: string) => {
    switch (classType) {
      case 'economy':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'business':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'first':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Flight Details" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading flight information...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !flight) {
    return (
      <>
        <Header title="Error" />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600 mb-4">{error || t('pages.flights.dataNotFound')}</p>
              <button
                onClick={handleBack}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`Flight ${flight.flightNumber}`} />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Search
          </button>

          {/* Flight Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{flight.airline}</h1>
                  <p className="text-lg text-gray-600">Flight {flight.flightNumber}</p>
                  <p className="text-sm text-gray-500">
                    {flight.departure.city} → {flight.arrival.city}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600 flex items-center justify-end">
                  <span className="text-2xl mr-1">$</span>
                  {flight.price}
                </div>
                <div className="text-sm text-gray-500">
                  {flight.passengers || 1} {flight.passengers === 1 ? t('pages.flights.passenger') : t('pages.flights.passengers')}
                </div>
              </div>
            </div>

            {/* Cabin Class Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getCabinClassColor(flight.cabinClass || 'economy')}`}>
              {getCabinClassIcon(flight.cabinClass || 'economy')}
              <span className="ml-2 font-medium">{getCabinClassLabel(flight.cabinClass || 'economy')}</span>
            </div>
          </div>

          {/* Flight Route */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('pages.flights.route')}</h2>
            
            <div className="flex items-center justify-between">
              {/* Departure */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-green-500 mr-2" />
                  <span className="text-lg font-semibold text-gray-800">{flight.departure.city}</span>
                </div>
                <div className="text-gray-600 mb-2">{flight.departure.airport}</div>
                <div className="text-3xl font-bold text-gray-800">{flight.departure.time}</div>
                <div className="text-gray-500">{flight.departure.date}</div>
              </div>

              {/* Flight Path */}
              <div className="flex flex-col items-center mx-8">
                <div className="w-24 h-px bg-gray-300 relative">
                  <Plane className="w-6 h-6 text-blue-500 absolute -top-3 left-1/2 transform -translate-x-1/2" />
                </div>
                <div className="text-center mt-4">
                  <div className="text-lg font-semibold text-gray-800">{flight.duration}</div>
                  <div className="text-sm text-gray-500">
                    {flight.stops === 0 ? t('pages.flights.directFlight') : `${flight.stops} ${t('pages.flights.stop')}${flight.stops === 1 ? '' : 's'}`}
                  </div>
                </div>
              </div>

              {/* Arrival */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-lg font-semibold text-gray-800 mr-2">{flight.arrival.city}</span>
                  <MapPin className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-gray-600 mb-2">{flight.arrival.airport}</div>
                <div className="text-3xl font-bold text-gray-800">{flight.arrival.time}</div>
                <div className="text-gray-500">{flight.arrival.date}</div>
              </div>
            </div>
          </div>

          {/* Flight Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('pages.flights.flightDetails')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flight.aircraft && (
                <div className="flex items-center space-x-3">
                  <Plane className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">{t('pages.flights.aircraftType')}</div>
                    <div className="font-medium text-gray-800">{flight.aircraft}</div>
                  </div>
                </div>
              )}

              {flight.baggage && (
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">{t('pages.flights.baggage')}</div>
                    <div className="font-medium text-gray-800">{flight.baggage}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">{t('pages.flights.refundPolicy')}</div>
                  <div className={`font-medium ${flight.refundable ? 'text-green-600' : 'text-red-600'}`}>
                    {flight.refundable ? t('pages.flights.refundable') : t('pages.flights.nonRefundable')}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">{t('pages.flights.flightDuration')}</div>
                  <div className="font-medium text-gray-800">{flight.duration}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">{t('pages.flights.stops')}</div>
                  <div className="font-medium text-gray-800">
                    {flight.stops === 0 ? t('pages.flights.directFlight') : `${flight.stops} ${t('pages.flights.stop')}${flight.stops === 1 ? '' : 's'}`}
                  </div>
                </div>
              </div>

              {flight.cabinClass && (
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">{t('pages.flights.cabinClass')}</div>
                    <div className="font-medium text-gray-800">{getCabinClassLabel(flight.cabinClass)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('pages.flights.priceInformation')}</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600">{t('pages.flights.pricePerPassenger')}</div>
                  <div className="text-2xl font-bold text-blue-800 flex items-center">
                    <span className="text-xl mr-1">$</span>
                    {flight.price}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600">{t('pages.flights.numberOfPassengers')}</div>
                  <div className="text-xl font-semibold text-blue-800">{flight.passengers || 1}</div>
                </div>
              </div>
              
              {flight.totalPrice && flight.totalPrice !== flight.price && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium text-blue-800">{t('pages.flights.totalPrice')}</div>
                    <div className="text-2xl font-bold text-blue-800 flex items-center">
                      <span className="text-xl mr-1">$</span>
                      {flight.totalPrice}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('pages.flights.booking')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <FlightBookingForm
                  flightNumber={flight.flightNumber}
                  airline={flight.airline}
                  departure={flight.departure}
                  arrival={flight.arrival}
                  price={flight.price}
                  passengers={flight.passengers}
                  cabinClass={flight.cabinClass}
                />
              </div>
              
              <div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-gray-800 mb-4">{t('pages.flights.alternativeBookingOptions')}</h3>
                  <div className="space-y-4">
                    {flight.link && (
                      <div>
                        <a
                          href={flight.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('pages.flights.bookOnAirlineWebsite')}
                        </a>
                      </div>
                    )}
                    
                    <a
                      href={`https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${flight.departure.airport}%20to%20${flight.arrival.airport}%20on%20${flight.departure.date}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
                    >
                       {t('pages.flights.searchOnGoogleFlights')}
                    </a>
                    
                    <a
                      href={`https://www.skyscanner.com/flights/${flight.departure.airport}/${flight.arrival.airport}/${flight.departure.date.replace(/\//g, '-')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors w-full justify-center"
                    >
                       {t('pages.flights.checkOnSkyscanner')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800">
                <p className="font-medium mb-1">{t('pages.flights.importantInformation')}:</p>
                <ul className="text-sm space-y-1">
                  <li>• {t('pages.flights.allDataObtained')}</li>
                  <li>• {t('pages.flights.pricesMayVary')}</li>
                  <li>• {t('pages.flights.pleaseVerifyDetails')}</li>
                  <li>• {t('pages.flights.checkBaggageRules')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
