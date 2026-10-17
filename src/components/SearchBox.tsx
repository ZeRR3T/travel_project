'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';


interface Hotel {
  id?: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  image?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  checkIn?: string;
  checkOut?: string;
  hotelClass?: string;
  amenities?: string[];
  nearbyPlaces?: any[];
}

type SearchResult = {
  type: 'text';
  data: string;
} | {
  type: 'hotels';
  data: Hotel[];
  warning?: string;
};

const HOTELS_PER_PAGE = 10;

  // Function to generate unique hotel ID
const generateHotelId = (hotel: Hotel, index: number): string => {
      // Create unique ID based on name, description and index
  const baseId = `${hotel.name.replace(/\s+/g, '-').toLowerCase()}-${hotel.description.substring(0, 10).replace(/\s+/g, '-').toLowerCase()}-${index}`;
  return baseId.replace(/[^a-z0-9-]/g, '');
};

export interface SearchBoxRef {
  search: (searchQuery: string) => void;
}

export const SearchBox = forwardRef<SearchBoxRef>((props, ref) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    const lastSearchQuery = localStorage.getItem('lastSearchQuery');
    const lastSearchResult = localStorage.getItem('lastSearchResult');

    if (pathname === '/hotels' && lastSearchQuery && lastSearchResult) {
      setQuery(lastSearchQuery);
      setResult(JSON.parse(lastSearchResult));
    }
  }, [pathname]);

  // Expose search method through ref
  useImperativeHandle(ref, () => ({
    search: (searchQuery: string) => {
      console.log(' SearchBox.search called with query:', searchQuery);
      setQuery(searchQuery);
      // Сразу запускаем поиск с новым запросом
      handleSearchWithQuery(searchQuery);
    }
  }));

  // Base search function that accepts a query string
  const handleSearchWithQuery = async (searchQuery: string) => {
    console.log(' handleSearchWithQuery called with:', searchQuery);
    if (!searchQuery.trim()) {
      console.warn(' Empty search query');
      return;
    }

    setIsLoading(true);
    setCurrentPage(1);
    try {
      console.log(' Sending search request for:', searchQuery);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        console.error(' Search request failed:', response.status, response.statusText);
        throw new Error('Search failed');
      }

      const result = await response.json();
      console.log(' Search response:', result);
      
      // Обрабатываем результаты поиска отелей
      if (result.type === 'hotels' && result.data) {
        console.log(' Processing hotel results');
        // Убираем дубликаты по имени отеля и создаем уникальные ID
        const uniqueHotels = result.data.reduce((acc: Hotel[], hotel: Hotel) => {
          const existingIndex = acc.findIndex(h => h.name === hotel.name);
          if (existingIndex === -1) {
            acc.push(hotel);
          }
          return acc;
        }, []);
        
        // Добавляем изображения и уникальные ID для каждого отеля
        const processedHotels = uniqueHotels.map((hotel: Hotel, index: number) => ({
          ...hotel,
          id: `hotel-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          image: hotel.image || ''
        }));
        
        result.data = processedHotels;
      }
      
      setResult(result);
      console.log(' Search completed successfully');

      if (pathname === '/hotels') {
        localStorage.setItem('lastSearchQuery', searchQuery);
        localStorage.setItem('lastSearchResult', JSON.stringify(result));
      }
    } catch (error) {
      console.error(' Search error:', error);
      setResult({
        type: 'text',
        data: 'An error occurred during search. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Click handler for the search button
  const handleSearch = () => {
    console.log(' Manual search triggered with query:', query);
    handleSearchWithQuery(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResult(null);
    setCurrentPage(1);
    localStorage.removeItem('lastSearchQuery');
    localStorage.removeItem('lastSearchResult');
  };

  const handleHotelClick = (hotel: Hotel) => {
    sessionStorage.setItem('selectedHotel', JSON.stringify(hotel));
    window.location.href = `/hotels/${encodeURIComponent(hotel.name)}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginatedHotels = () => {
    if (result?.type !== 'hotels') return [];
    
    const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
    const endIndex = startIndex + HOTELS_PER_PAGE;
    const hotels = result.data.slice(startIndex, endIndex);
    
    // Убеждаемся, что у каждого отеля есть уникальный ID
    return hotels.map((hotel: Hotel, index: number) => ({
      ...hotel,
      id: hotel.id || `hotel-${startIndex + index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  };

  const getTotalPages = () => {
    if (result?.type !== 'hotels') return 0;
    return Math.ceil(result.data.length / HOTELS_PER_PAGE);
  };

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('pages.hotels.searchPlaceholder')}
          className="w-full px-4 py-3 text-white placeholder-slate-300 border border-slate-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 bg-slate-800/50 backdrop-blur-sm shadow-lg"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isLoading ? t('common.searching') : t('common.search')}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          {result.type === 'hotels' && result.data.length > 0 && (
            <>
              {result.warning && (
                <div className="mb-4 p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-amber-400 mr-2"></div>
                    <p className="text-amber-200 text-sm">{result.warning}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {t('pages.hotels.foundHotels')}: {result.data.length} ({t('common.page')} {currentPage} {t('common.of')} {getTotalPages()})
                </h2>
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-slate-300 hover:text-white transition-colors hover:bg-slate-700/50 px-3 py-1 rounded-lg"
                >
                  {t('common.clearSearch')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {getPaginatedHotels().map((hotel: Hotel) => (
                  <div
                    key={hotel.id}
                    onClick={() => handleHotelClick(hotel)}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 hover:scale-105"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={hotel.image || ''}
                        alt={hotel.name}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.parentElement?.querySelector('.hotel-placeholder') as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="hotel-placeholder absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center" style={{ display: 'none' }}>
                        <div className="text-center">
                          <div className="text-4xl mb-2"></div>
                          <div className="text-sm text-slate-300 font-medium">{t('pages.hotels.hotelPhoto')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {hotel.name}
                      </h3>
                      <p className="text-sm text-slate-300 mb-2 line-clamp-3">
                        {hotel.description}
                      </p>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-amber-400 mr-1" />
                          <span className="text-sm text-slate-300">
                            {hotel.rating} ({hotel.reviews})
                          </span>
                        </div>
                        <span className="text-lg font-semibold text-yellow-400 flex items-center">
                          {hotel.price}
                        </span>
                      </div>
                      {hotel.hotelClass && (
                        <div className="text-xs text-slate-400 mb-2">
                          {hotel.hotelClass}
                        </div>
                      )}
                      {hotel.amenities && hotel.amenities.length > 0 && (
                        <div className="text-xs text-slate-400 mb-2">
                          <span className="font-medium">{t('pages.hotels.amenities')}:</span> {hotel.amenities.slice(0, 3).join(', ')}
                          {hotel.amenities.length > 3 && '...'}
                        </div>
                      )}
                      {hotel.checkIn && hotel.checkOut && (
                        <div className="text-xs text-slate-400">
                          {t('pages.hotels.checkIn')}: {hotel.checkIn} | {t('pages.hotels.checkOut')}: {hotel.checkOut}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-600/30 rounded-lg hover:bg-slate-700/50 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all duration-300"
                >
                  {t('common.previous')}
                </button>
                <span className="px-3 py-2 text-sm text-slate-300">
                  {t('common.page')} {currentPage} {t('common.of')} {getTotalPages()}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                  className="px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 border border-slate-600/30 rounded-lg hover:bg-slate-700/50 hover:border-slate-500/50 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all duration-300"
                >
                  {t('common.next')}
                </button>
              </div>
            </>
          )}
          {result.type === 'text' && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-slate-600/30">
              <p className="text-white whitespace-pre-wrap">{result.data}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}); 