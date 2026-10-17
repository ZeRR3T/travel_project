'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Plane, Calendar, MapPin, Users, Search, ExternalLink, Briefcase, Crown, Star } from 'lucide-react';
import ValidationWarnings from '@/components/ValidationWarnings';
import AirportSelector from '@/components/AirportSelector';
import CityAutocomplete from '@/components/CityAutocomplete';
import SearchStatistics from '@/components/SearchStatistics';
import { Flight } from '@/types/flights';
import { useI18n } from '@/i18n/context/I18nContext';

// Flight Card Component
const FlightCard = ({ flight, index, cabinClass, onClick }: { 
  flight: Flight; 
  index: number; 
  cabinClass: string; 
  onClick: (flight: Flight, index: number) => void; 
}) => {
  const getCabinClassIcon = (classType: string) => {
    switch (classType) {
      case 'economy':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'business':
        return <Briefcase className="w-4 h-4 text-green-500" />;
      case 'first':
        return <Crown className="w-4 h-4 text-purple-500" />;
      default:
        return <Star className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCabinClassLabel = (classType: string) => {
    switch (classType) {
      case 'economy':
        return 'Economy Class';
      case 'business':
        return 'Business Class';
      case 'first':
        return 'First Class';
      default:
        return 'Economy Class';
    }
  };

  return (
    <div 
      className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group hover:-translate-y-1"
      onClick={() => onClick(flight, index)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
            <Plane className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{flight.airline}</h3>
            <p className="text-sm text-slate-600">Flight {flight.flightNumber}</p>
            <div className="flex items-center space-x-2 mt-1">
              {getCabinClassIcon(flight.cabinClass || cabinClass)}
              <span className="text-xs text-slate-500">{getCabinClassLabel(flight.cabinClass || cabinClass)}</span>
              {flight.tripType && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  flight.tripType === 'return' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {flight.tripType === 'return' ? ' Return' : ' Outbound'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600 flex items-center justify-end">
            <span className="text-lg mr-1">$</span>
            {flight.price}
          </div>
          <div className="text-sm text-slate-500">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="font-medium text-slate-800">{flight.departure.city}</span>
          </div>
          <div className="text-sm text-slate-600">{flight.departure.airport}</div>
          <div className="text-lg font-semibold text-slate-800">{flight.departure.time}</div>
          <div className="text-xs text-slate-500">{flight.departure.date}</div>
        </div>

        <div className="flex flex-col items-center mx-4">
          <div className="w-16 h-px bg-gray-300 relative">
            <Plane className="w-4 h-4 text-blue-500 absolute -top-2 left-1/2 transform -translate-x-1/2" />
          </div>
          <div className="text-xs text-slate-500 mt-2">{flight.duration}</div>
        </div>

        <div className="flex-1 text-right">
          <div className="flex items-center space-x-2 mb-1 justify-end">
            <span className="font-medium text-slate-800">{flight.arrival.city}</span>
            <MapPin className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-sm text-slate-600">{flight.arrival.airport}</div>
          <div className="text-lg font-semibold text-slate-800">{flight.arrival.time}</div>
          <div className="text-xs text-slate-500">{flight.arrival.date}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        {flight.aircraft && (
          <span>Aircraft: {flight.aircraft}</span>
        )}
        {flight.baggage && (
          <span>Baggage: {flight.baggage}</span>
        )}
        {flight.refundable !== undefined && (
          <span className={flight.refundable ? 'text-green-600' : 'text-red-600'}>
            {flight.refundable ? 'Refundable' : 'Non-refundable'}
          </span>
        )}
      </div>
      
      {/* Click hint and external link */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-blue-600 font-medium">
           Click for detailed information
        </div>
        <a 
          href={flight.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Book Now
        </a>
      </div>
    </div>
  );
};

export default function FlightsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOneWay, setIsOneWay] = useState(false);
  const [cabinClass, setCabinClass] = useState('economy');
  const [passengers, setPassengers] = useState(1);
  const [selectedFromAirports, setSelectedFromAirports] = useState<string[]>([]);
  const [selectedToAirports, setSelectedToAirports] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  // Search state
  const [searchTime, setSearchTime] = useState<number | undefined>(undefined);
  
  // Pagination state
  const FLIGHTS_PER_PAGE = 15;

  // Flight filter state
  const [flightFilter, setFlightFilter] = useState<'all' | 'outbound' | 'return'>('all');

  // Log state changes for debugging
  console.log(' Component state:', {
    from, to, date, returnDate, isOneWay, passengers, cabinClass,
    hasReturnDate: !!returnDate,
    returnDateLength: returnDate ? returnDate.length : 0
  });

  // Restore search results and form data from sessionStorage on component mount
  useEffect(() => {
    const savedFlights = sessionStorage.getItem('searchResults');
    const savedFormData = sessionStorage.getItem('searchFormData');
    
    if (savedFlights) {
      try {
        const parsedFlights = JSON.parse(savedFlights);
        setFlights(parsedFlights);
        setSearchPerformed(true);
      } catch (err) {
        console.error('Error parsing saved flights:', err);
      }
    }
    
    if (savedFormData) {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        setFrom(parsedFormData.from || '');
        setTo(parsedFormData.to || '');
        setDate(parsedFormData.date || '');
        setReturnDate(parsedFormData.returnDate || '');
        setIsOneWay(parsedFormData.isOneWay || false);
        setPassengers(parsedFormData.passengers || 1);
        // Handle cabin class (now always string)
        const savedCabinClass = parsedFormData.cabinClass || 'economy';
        setCabinClass(typeof savedCabinClass === 'string' ? savedCabinClass : 'economy');
        setSelectedFromAirports(parsedFormData.selectedFromAirports || []);
        setSelectedToAirports(parsedFormData.selectedToAirports || []);

      } catch (err) {
        console.error('Error parsing saved form data:', err);
      }
    }
  }, []);

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginatedFlights = (flightList: Flight[]) => {
    const filteredFlights = getFilteredFlights(flightList);
    const startIndex = (currentPage - 1) * FLIGHTS_PER_PAGE;
    const endIndex = startIndex + FLIGHTS_PER_PAGE;
    return filteredFlights.slice(startIndex, endIndex);
  };

  const getTotalPages = (flightList: Flight[]) => {
    const filteredFlights = getFilteredFlights(flightList);
    return Math.ceil(filteredFlights.length / FLIGHTS_PER_PAGE);
  };

  // Get filtered flights based on current filter
  const getFilteredFlights = (flightList: Flight[]) => {
    switch (flightFilter) {
      case 'outbound':
        return flightList.filter(f => f.tripType === 'outbound');
      case 'return':
        return flightList.filter(f => f.tripType === 'return');
      default:
        return flightList;
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    console.log(' Search form values:', { from, to, date, returnDate, isOneWay, passengers, cabinClass });
    
    if (!from.trim() || !to.trim() || !date || (!isOneWay && !returnDate)) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Ensure cabin class is selected
    if (!cabinClass || cabinClass.trim() === '') {
      setError('Please select a cabin class');
      return;
    }

    setIsLoading(true);
    setError('');
    setFlights([]);
    setSearchTime(undefined);
    resetPagination();
    setFlightFilter('all'); // Reset flight filter on new search
    
    const startTime = performance.now();

    try {
      // Determine if this is actually a round-trip search
      const actualIsOneWay = isOneWay || !returnDate || returnDate.trim() === '';
      const finalReturnDate = actualIsOneWay ? null : returnDate;
      
      console.log(' Final search params:', {
        from, to, date, 
        returnDate: finalReturnDate, 
        passengers, cabinClass, 
        isOneWay: actualIsOneWay,
        originalIsOneWay: isOneWay,
        hasReturnDate: !!returnDate
      });

      // Cabin class is now always a string
      const normalizedCabinClass = cabinClass;
      
      const response = await fetch('/api/flight-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          from, 
          to, 
          date, 
          returnDate: finalReturnDate, 
          passengers, 
          cabinClass: normalizedCabinClass, 
          isOneWay: actualIsOneWay,
                  selectedFromAirports,
        selectedToAirports
        }),
      });

      if (!response.ok) {
        throw new Error('Error searching for flights');
      }

      const result = await response.json();
      
      if (result.type === 'flights') {
        setFlights(result.data);
        setSearchPerformed(true);
        
        // Extract validation warnings if any
        if (result.validationWarnings) {
          setValidationWarnings(result.validationWarnings);
        } else {
          setValidationWarnings([]);
        }
        

        
        // Save search results and form data to sessionStorage
        sessionStorage.setItem('searchResults', JSON.stringify(result.data));
        sessionStorage.setItem('searchFormData', JSON.stringify({
          from, to, date, returnDate: finalReturnDate, 
          isOneWay: actualIsOneWay, passengers, cabinClass: normalizedCabinClass,
          selectedFromAirports, selectedToAirports
        }));
      } else {
        setError(result.data || 'Unable to find flights');
        setValidationWarnings([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching for flights. Please try again.');
    } finally {
      const endTime = performance.now();
      setSearchTime(Math.round(endTime - startTime));
      setIsLoading(false);
    }
  };



  const handleFlightClick = (flight: Flight, index: number) => {
    // Save flight data to sessionStorage
    sessionStorage.setItem('selectedFlight', JSON.stringify(flight));
    // Navigate to flight details page
    router.push(`/flights/${index}`);
  };

  const clearSearchResults = () => {
    setFlights([]);
    setSearchPerformed(false);
    setError('');
    setSelectedFromAirports([]);
    setSelectedToAirports([]);

    // Clear saved data from sessionStorage
    sessionStorage.removeItem('searchResults');
    sessionStorage.removeItem('searchFormData');
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Flight Tickets" />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-indigo-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e2e8f0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/60 backdrop-blur-sm rounded-full mb-6 shadow-sm">
              <Plane className="w-8 h-8 text-slate-700" />
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
              Find Your Perfect Flight
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-600 mb-8 leading-relaxed">
              Discover the best prices for flights around the world with real data
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center text-slate-600 text-sm">
                <Star className="w-4 h-4 mr-2 text-amber-400" />
                <span>Best prices guaranteed</span>
              </div>
              <div className="flex items-center text-slate-600 text-sm">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                <span>Global destinations</span>
              </div>
              <div className="flex items-center text-slate-600 text-sm">
                <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                <span>Flexible dates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Search Form */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">
              Ready to fly?
            </h2>
            <p className="text-slate-600">
              Enter your travel details and find the best flight options
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <CityAutocomplete
                value={from}
                onChange={setFrom}
                label="From"
                placeholder="City or Airport"
                className="mb-2"
              />
              
              {/* Airport Selector for departure city */}
              <AirportSelector
                city={from}
                selectedAirports={selectedFromAirports}
                onAirportSelect={setSelectedFromAirports}
                label="Select departure airport"
                className="mt-2"
                multiple={true}
              />
            </div>

            <div>
              <CityAutocomplete
                value={to}
                onChange={setTo}
                label="To"
                placeholder="City or Airport"
                className="mb-2"
              />
              
              {/* Airport Selector for arrival city */}
              <AirportSelector
                city={to}
                selectedAirports={selectedToAirports}
                onAirportSelect={setSelectedToAirports}
                label="Select destination airport"
                className="mt-2"
                multiple={true}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                  <input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                  />
              </div>
              {!isOneWay && (
                <>
                  <label htmlFor="returnDate" className="block text-sm font-medium text-slate-700 mb-2 mt-2">
                    Return Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="date"
                      id="returnDate"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isOneWay"
                  checked={isOneWay}
                  onChange={(e) => setIsOneWay(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isOneWay" className="ml-2 text-sm font-medium text-slate-700">
                  One-way flight
                </label>
              </div>
              
              {!isOneWay && returnDate && (
                <div className="mb-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                   Round-trip search: The system will search for both outbound and return flights.
                </div>
              )}
              
              {/* Return Date moved under Departure Date */}
            </div>
          </div>
          


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cabin Class
              </label>
              <div className="relative">
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                >
                  <option value="economy" className="text-black">Economy Class</option>
                  <option value="business" className="text-black">Business Class</option>
                  <option value="first" className="text-black">First Class</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="passengers" className="block text-sm font-medium text-slate-700 mb-2">
                Passengers
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                  <select 
                    id="passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                  >
                                      <option value={1} className="text-black">1 passenger</option>
                    <option value={2} className="text-black">2 passengers</option>
                    <option value={3} className="text-black">3 passengers</option>
                    <option value={4} className="text-black">4 passengers</option>
                    <option value={5} className="text-black">5 passengers</option>
                    <option value={6} className="text-black">6 passengers</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8 text-center">
                          <button 
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-all duration-300 font-semibold flex items-center justify-center mx-auto disabled:bg-gray-400 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
              <Search className="w-5 h-5 mr-2" />
              {isLoading ? 'Searching...' : 'Find Flights'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {error && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}



      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <ValidationWarnings 
            warnings={validationWarnings.map(warning => ({
              message: warning,
              type: 'warning'
            }))}
          />
        </div>
      )}

      {flights.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  <Plane className="w-6 h-6 mr-3 text-blue-600" />
                  {getFilteredFlights(flights).length} Flight{getFilteredFlights(flights).length !== 1 ? 's' : ''} Found
                  {getFilteredFlights(flights).length > FLIGHTS_PER_PAGE && (
                    <span className="text-lg font-normal text-slate-600 ml-2">
                      (Page {currentPage} of {getTotalPages(flights)})
                    </span>
                  )}
                </h2>
                
                {/* Flight filter buttons */}
                {flights.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    <button
                      onClick={() => {
                        setFlightFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        flightFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                       All Flights
                    </button>
                    <button
                      onClick={() => {
                        setFlightFilter('outbound');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        flightFilter === 'outbound'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                       Outbound Only
                    </button>
                    <button
                      onClick={() => {
                        setFlightFilter('return');
                        setCurrentPage(1);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        flightFilter === 'return'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={!flights.some(f => f.tripType === 'return')}
                    >
                       Return Only
                    </button>
                  </div>
                )}
                
                {/* Airport selection info */}
                {(selectedFromAirports.length > 0 || selectedToAirports.length > 0) && (
                  <div className="text-sm text-slate-600 mt-2">
                    <div className="flex flex-wrap gap-4">
                      {selectedFromAirports.length > 0 && (
                        <span className="flex items-center">
                          <span className="font-medium">Departure:</span>
                          <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {selectedFromAirports.map(airport => `${airport}, `).slice(0, -2)}
                          </span>
                        </span>
                      )}
                      {selectedToAirports.length > 0 && (
                        <span className="flex items-center">
                          <span className="font-medium">Destination:</span>
                          <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {selectedToAirports.map(airport => `${airport}, `).slice(0, -2)}
                          </span>
                        </span>
                      )}

                    </div>
                  </div>
                )}
                {searchPerformed && (
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                     Results restored
                  </span>
                )}
              </div>
              <button
                onClick={clearSearchResults}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              >
                Clear Search
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Display filtered flights */}
              {getPaginatedFlights(flights).map((flight, index) => (
                <FlightCard key={`${flight.tripType}-${index}`} flight={flight} index={index} cabinClass={cabinClass} onClick={handleFlightClick} />
              ))}
            </div>
            
            {/* Pagination */}
            {getFilteredFlights(flights).length > FLIGHTS_PER_PAGE && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: getTotalPages(flights) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages(flights)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Statistics */}
      {flights.length > 0 && (
        <div className="container mx-auto px-4 mb-8">
          <SearchStatistics 
          />
        </div>
      )}

      {/* Popular Routes */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Popular Routes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">Moscow → Saint Petersburg</span>
                <Plane className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-600">from 3,500 ₽</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">Moscow → Sochi</span>
                <Plane className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-600">from 4,200 ₽</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 hover:border-blue-300 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-800">Saint Petersburg → Kazan</span>
                <Plane className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-slate-600">from 5,800 ₽</p>
            </div>
          </div>
        </div>
      </div>

      {/* Airlines */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Our Partners
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-medium text-slate-800">Aeroflot</p>
            </div>
            <div className="text-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-medium text-slate-800">S7 Airlines</p>
            </div>
            <div className="text-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 text-purple-600" />
              </div>
              <p className="font-medium text-slate-800">Utair</p>
            </div>
            <div className="text-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Plane className="w-8 h-8 text-orange-600" />
              </div>
              <p className="font-medium text-slate-800">Red Wings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}