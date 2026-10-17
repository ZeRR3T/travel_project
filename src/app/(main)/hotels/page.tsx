'use client';

import { useState } from 'react';
import { SearchBox } from '@/components/SearchBox';
import { MainLayout } from '@/components/MainLayout';
import { useI18n } from '@/i18n/context/I18nContext';
import { MapPin, Star, Filter, Grid3X3, List, Heart, Share2, Phone, Wifi, Car, Dumbbell, Utensils, Globe, Coffee, Map, Building2, Bath } from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  image: string;
  amenities: string[];
  description: string;
  distance: string;
  reviews: number;
}

const amenitiesIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  parking: Car,
  spa: Bath,
  pool: Building2,
  restaurant: Utensils,
  gym: Dumbbell,
  conference: Globe,
  shuttle: Car,
  bar: Coffee,
  'art-gallery': Map
};

export default function HotelsPage() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);

  const mockHotels: Hotel[] = [
    {
      id: '1',
      name: 'Grand Hotel & Spa',
      location: t('pages.hotels.centerCity'),
      rating: 4.8,
      price: 8500,
      image: '/api/placeholder/400/300',
      amenities: ['wifi', 'parking', 'spa', 'pool', 'restaurant'],
      description: t('pages.hotels.luxuryHotel'),
      distance: '0.5 km from center',
      reviews: 1247
    },
    {
      id: '2',
      name: 'Business Center Hotel',
      location: t('pages.hotels.businessDistrict'),
      rating: 4.6,
      price: 6500,
      image: '/api/placeholder/400/300',
      amenities: ['wifi', 'parking', 'gym', 'restaurant', 'conference'],
      description: t('pages.hotels.businessHotel'),
      distance: '1.2 km from center',
      reviews: 892
    },
    {
      id: '3',
      name: 'Airport Express Hotel',
      location: t('pages.hotels.airportArea'),
      rating: 4.4,
      price: 4200,
      image: '/api/placeholder/400/300',
      amenities: ['wifi', 'parking', 'shuttle', 'restaurant'],
      description: t('pages.hotels.convenientHotel'),
      distance: '0.3 km from airport',
      reviews: 567
    }
  ];

  const filteredHotels = mockHotels
    .filter(hotel => {
      if (selectedAmenities.length > 0) {
        return selectedAmenities.every(amenity => hotel.amenities.includes(amenity));
      }
      return true;
    })
    .filter(hotel => hotel.price >= priceRange[0] && hotel.price <= priceRange[1]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <MainLayout title={t('pages.hotels.title')}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 w-full">
        <div className="px-4 sm:px-6 lg:px-8 text-center w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {t('pages.hotels.search')}
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-8">
            {t('pages.hotels.searchPlaceholder')}
          </p>
          <SearchBox />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">{t('pages.hotels.filters')}</h3>
              </div>

              {/* Amenities Filter */}
              <div className="mb-8">
                <h4 className="font-medium text-slate-700 mb-4">{t('pages.hotels.amenities')}</h4>
                <div className="space-y-3">
                  {Object.entries(amenitiesIcons).map(([amenity, Icon]) => (
                    <label key={amenity} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 capitalize">
                        {amenity.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-8">
                <h4 className="font-medium text-slate-700 mb-4">{t('pages.hotels.priceRange')}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>₽{priceRange[0].toLocaleString()}</span>
                    <span>₽{priceRange[1].toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15000"
                    step="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hotels List */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('pages.hotels.foundHotels').replace('{count}', filteredHotels.length.toString())}
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hotels Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
              : 'space-y-6'
            }>
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Hotel Image */}
                  <div className={`relative ${viewMode === 'list' ? 'w-48 h-32' : 'h-48'}`}>
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm">{t('pages.hotels.hotelPhoto')}</span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Heart className="w-4 h-4 text-white" />
                      </button>
                      <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Share2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-slate-900">{hotel.name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-semibold text-slate-900">{hotel.rating}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{hotel.location}</span>
                    </div>

                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {hotel.description}
                    </p>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hotel.amenities.slice(0, 4).map((amenity) => {
                        const Icon = amenitiesIcons[amenity];
                        return Icon ? (
                          <div key={amenity} className="flex items-center gap-1 text-xs text-slate-500">
                            <Icon className="w-3 h-3" />
                            <span className="capitalize">{amenity.replace('-', ' ')}</span>
                          </div>
                        ) : null;
                      })}
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          ₽{hotel.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500">{t('pages.hotels.perNight')}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-300">
                          {t('pages.hotels.book')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
