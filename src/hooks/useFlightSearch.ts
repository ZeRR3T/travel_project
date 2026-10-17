import { useState, useCallback } from 'react';
import { Flight, SearchParams, SearchResult } from '@/types/flights';

interface UseFlightSearchReturn {
  flights: Flight[];
  isLoading: boolean;
  error: string;
  searchPerformed: boolean;
  searchTime: number | undefined;
  searchFlights: (params: SearchParams) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useFlightSearch(): UseFlightSearchReturn {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchTime, setSearchTime] = useState<number | undefined>(undefined);

  const searchFlights = useCallback(async (params: SearchParams) => {
    setIsLoading(true);
    setError('');
    setFlights([]);
    setSearchTime(undefined);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/flight-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Error searching for flights');
      }

      const result: SearchResult = await response.json();
      
      if (result.type === 'flights') {
        setFlights(result.data);
        setSearchPerformed(true);
      } else {
        setError(result.data || 'Unable to find flights');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching for flights. Please try again.');
    } finally {
      const endTime = performance.now();
      setSearchTime(Math.round(endTime - startTime));
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setFlights([]);
    setSearchPerformed(false);
    setError('');
    setSearchTime(undefined);
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    flights,
    isLoading,
    error,
    searchPerformed,
    searchTime,
    searchFlights,
    clearResults,
    clearError,
  };
}
