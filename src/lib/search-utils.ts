/**
 * Утилиты для работы с поисковыми запросами
 */

/**
 * Формирует URL для поиска в Google
 */
export function getGoogleSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.google.com/search?q=${encodedQuery}`;
}

/**
 * Формирует URL для поиска компании по аренде автомобилей
 */
export function getCarRentalSearchUrl(companyName: string, location: string): string {
  const searchQuery = `${companyName} car rental ${location} official site`;
  return getGoogleSearchUrl(searchQuery);
}

/**
 * Формирует URL для поиска такси компании
 */
export function getTaxiCompanySearchUrl(companyName: string, location: string): string {
  const searchQuery = `${companyName} taxi service ${location} official site`;
  return getGoogleSearchUrl(searchQuery);
}

/**
 * Формирует URL для поиска отеля
 */
export function getHotelSearchUrl(hotelName: string, location: string): string {
  const searchQuery = `${hotelName} hotel ${location} official booking`;
  return getGoogleSearchUrl(searchQuery);
}
