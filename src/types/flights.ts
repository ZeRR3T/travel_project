export interface Flight {
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
  stops: number;
  aircraft?: string;
  cabinClass?: string;
  baggage?: string;
  refundable?: boolean;
  link?: string;
  tripType?: 'outbound' | 'return';
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string | null;
  passengers: number;
  cabinClass: string;
  isOneWay: boolean;
  selectedFromAirport?: string | null;
  selectedToAirport?: string | null;
}

export type SearchResult = {
  type: 'text';
  data: string;
} | {
  type: 'flights';
  data: Flight[];
  warning?: string;
  validationWarnings?: string[];
};

export interface AirportCombination {
  from: string;
  to: string;
  fromName: string;
  toName: string;
}

export interface FlightSearchOptions {
  selectedFromAirport: string | null;
  selectedToAirport: string | null;
  cabinClass: string;
  passengers: number;
}

export interface FlightSearchResponse {
  success: boolean;
  flights: Flight[];
  totalFound: number;
  searchInfo: {
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    isOneWay: boolean;
    airportCombinations: AirportCombination[];
    searchOptions: FlightSearchOptions;
  };
  warnings?: string[];
  errors?: string[];
}
