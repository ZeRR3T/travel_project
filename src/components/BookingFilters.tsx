'use client';

import { useState } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { useI18n } from '@/i18n/context/I18nContext';

interface BookingFiltersProps {
  onFilterChange: (filters: BookingFilters) => void;
}

export interface BookingFilters {
  search: string;
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export function BookingFilters({ onFilterChange }: BookingFiltersProps) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<BookingFilters>({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const handleChange = (key: keyof BookingFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('pages.bookings.searchBookings')}
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('common.allTypes')}</option>
            <option value="hotel">{t('common.hotels')}</option>
            <option value="flight">{t('common.flights')}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('common.allStatuses')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="confirmed">{t('common.confirmed')}</option>
            <option value="cancelled">{t('common.cancelled')}</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleChange('dateFrom', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleChange('dateTo', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            {t('common.search')}: {filters.search}
            <button
              onClick={() => handleChange('search', '')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.type && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            {t('common.type')}: {filters.type}
            <button
              onClick={() => handleChange('type', '')}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.status && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            {t('common.status')}: {filters.status}
            <button
              onClick={() => handleChange('status', '')}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </span>
        )}
        {(filters.dateFrom || filters.dateTo) && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
            {t('common.date')}: {filters.dateFrom || t('common.any')} - {filters.dateTo || t('common.any')}
            <button
              onClick={() => {
                handleChange('dateFrom', '');
                handleChange('dateTo', '');
              }}
              className="ml-2 text-purple-600 hover:text-purple-800"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
