import fetch from 'node-fetch';

const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_GEMINI_API_KEY = process.env.OPENROUTER_GEMINI_API_KEY || '';

// Function to improve search parameters using Gemini
async function improveSearchParamsWithGemini(
  from: string, 
  to: string, 
  date: string, 
  returnDate: string | null,
  isOneWay: boolean
): Promise<{
  from: string;
  to: string;
  fromAirportCode: string;
  toAirportCode: string;
  departureDate: string;
  returnDate: string | null;
  bookingLink: string;
  error?: string;
  validationWarnings?: string[];
  fromAirports?: Array<{code: string, name: string}>;
  toAirports?: Array<{code: string, name: string}>;
  hasMultipleFromAirports?: boolean;
  hasMultipleToAirports?: boolean;
}> {
  try {
    const prompt = `Ты - эксперт по авиаперелетам и кодам аэропортов. Твоя задача - улучшить параметры поиска авиабилетов для использования в Google Flights API через SerpAPI.

ИСХОДНЫЕ ПАРАМЕТРЫ (НЕ ИЗМЕНЯТЬ):
- Откуда: "${from}"
- Куда: "${to}"
- Дата вылета: "${date}"
- Дата возврата: "${returnDate || 'не указана'}"
- Тип рейса: ${isOneWay ? 'односторонний' : 'туда-обратно'}

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. ДАТЫ НЕ ИЗМЕНЯТЬ НИКОГДА! departureDate="${date}", returnDate="${returnDate || 'null'}"
2. Для односторонних рейсов returnDate = departureDate (та же дата)
3. Для туда-обратно returnDate должен быть ПОСЛЕ departureDate

ЗАДАЧИ:
1. Нормализуй названия городов (исправь опечатки, расширь сокращения)
2. Найди основные аэропорты города с точными IATA кодами
3. Создай ссылку для Google Flights с правильными кодами аэропортов

ТРЕБОВАНИЯ К АЭРОПОРТАМ:
- Используй только официальные IATA коды (3 заглавные буквы: JFK, LAX, CDG)
- Включи ВСЕ основные международные аэропорты города (не только один!)
- Для каждого аэропорта укажи: code (IATA), name (полное название)

ПРИМЕРЫ ПРАВИЛЬНЫХ IATA КОДОВ:
- New York: JFK, LGA, EWR (3 основных аэропорта)
- Los Angeles: LAX, BUR, ONT, SNA (4 основных аэропорта)
- London: LHR, LGW, STN, LCY (4 основных аэропорта)
- Paris: CDG, ORY (2 основных аэропорта)
- Moscow: SVO, DME, VKO (3 основных аэропорта)

ФОРМАТ ССЫЛКИ GOOGLE FLIGHTS:
- Односторонний: https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20[FROM_IATA]%20to%20[TO_IATA]%20on%20[DATE]
- Туда-обратно: https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20[FROM_IATA]%20to%20[TO_IATA]%20on%20[DATE]%20return%20on%20[RETURN_DATE]

ВАЛИДАЦИЯ:
- Все IATA коды должны быть 3 заглавными буквами
- Коды аэропортов должны быть реальными и активными
- fromAirportCode и toAirportCode - это основные аэропорты
- fromAirports и toAirports - списки основных аэропортов

Ответь СТРОГО в формате JSON без дополнительного текста:
{
  "from": "нормализованное название города",
  "to": "нормализованное название города",
  "fromAirportCode": "IATA код основного аэропорта отправления",
  "toAirportCode": "IATA код основного аэропорта назначения",
  "departureDate": "${date}",
  "returnDate": "${returnDate || 'null'}",
  "bookingLink": "точная ссылка на Google Flights с IATA кодами и датами",
  "fromAirports": [
    {
      "code": "IATA код (3 заглавные буквы)",
      "name": "Полное официальное название аэропорта"
    }
  ],
  "toAirports": [
    {
      "code": "IATA код (3 заглавные буквы)",
      "name": "Полное официальное название аэропорта"
    }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      // Fallback to original parameters without database lookup
      return {
        from: from.trim(),
        to: to.trim(),
        fromAirportCode: from.trim().toUpperCase(),
        toAirportCode: to.trim().toUpperCase(),
        departureDate: date,
        returnDate: returnDate,
        bookingLink: isOneWay ? 
          `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}` :
          (returnDate ? 
            `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}%20return%20on%20${returnDate}` :
            `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}`
          ),
        error: `Gemini API error: ${response.status} ${response.statusText}`,
        fromAirports: [],
        toAirports: [],
        hasMultipleFromAirports: false,
        hasMultipleToAirports: false
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    try {
      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(' Gemini improved params:', parsed);
        
        // Validate Gemini response
        const validation = {
          isValid: true,
          errors: [],
          correctedParams: parsed
        };
        
        if (!validation.isValid) {
          console.warn(' Gemini response validation failed:', validation.errors);
        }
        
        // Use corrected parameters
        const finalParams = validation.correctedParams;
        
        // Final validation and fallback
        const finalDepartureDate = finalParams.departureDate === date ? finalParams.departureDate : date;
        const finalReturnDate = finalParams.returnDate === returnDate ? finalParams.returnDate : returnDate;
        
     // Ensure airport codes are valid and follow IATA format (3 uppercase letters)
     const finalFromAirportCode = finalParams.fromAirportCode && /^[A-Z]{3}$/.test(finalParams.fromAirportCode) 
       ? finalParams.fromAirportCode 
       : from.trim().toUpperCase();
     const finalToAirportCode = finalParams.toAirportCode && /^[A-Z]{3}$/.test(finalParams.toAirportCode) 
       ? finalParams.toAirportCode 
       : to.trim().toUpperCase();
        
        console.log(' Final validated params:', {
          dates: {
            originalDeparture: date,
            geminiDeparture: finalParams.departureDate,
            finalDeparture: finalDepartureDate,
            originalReturn: returnDate,
            geminiReturn: finalParams.returnDate,
            finalReturn: finalReturnDate
          },
          airports: {
            originalFrom: from,
            geminiFromAirport: finalParams.fromAirportCode,
            finalFromAirport: finalFromAirportCode,
            originalTo: to,
            geminiToAirport: finalParams.toAirportCode,
            finalToAirport: finalToAirportCode
          },
          validation: {
            isValid: validation.isValid,
            errors: validation.errors
          }
        });
        
        return {
          from: finalParams.from || from.trim(),
          to: finalParams.to || to.trim(),
          fromAirportCode: finalFromAirportCode,
          toAirportCode: finalToAirportCode,
          departureDate: finalDepartureDate,
          returnDate: finalReturnDate,
          bookingLink: finalParams.bookingLink || (isOneWay ? 
            `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${finalFromAirportCode}%20to%20${finalToAirportCode}%20on%20${finalDepartureDate}` :
            (finalReturnDate ? 
              `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${finalFromAirportCode}%20to%20${finalToAirportCode}%20on%20${finalDepartureDate}%20return%20on%20${finalReturnDate}` :
              `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${finalFromAirportCode}%20to%20${finalToAirportCode}%20on%20${finalDepartureDate}`
            )),
          validationWarnings: validation.errors,
          fromAirports: Array.isArray(finalParams.fromAirports) ? finalParams.fromAirports : [],
          toAirports: Array.isArray(finalParams.toAirports) ? finalParams.toAirports : [],
          hasMultipleFromAirports: Array.isArray(finalParams.fromAirports) ? finalParams.fromAirports.length > 1 : false,
          hasMultipleToAirports: Array.isArray(finalParams.toAirports) ? finalParams.toAirports.length > 1 : false
        };
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
    }

    // Fallback: extract city names from text response
    const fromMatch = content.match(/(?:откуда|from|из):\s*["']?([^"'\n]+)["']?/i);
    const toMatch = content.match(/(?:куда|to|в):\s*["']?([^"'\n]+)["']?/i);
    const dateMatch = content.match(/(?:дата|date):\s*["']?([^"'\n]+)["']?/i);
    
    return {
      from: fromMatch ? fromMatch[1].trim() : from.trim(),
      to: toMatch ? toMatch[1].trim() : to.trim(),
      fromAirportCode: fromMatch ? fromMatch[1].trim().toUpperCase() : from.trim().toUpperCase(),
      toAirportCode: toMatch ? toMatch[1].trim().toUpperCase() : to.trim().toUpperCase(),
      departureDate: dateMatch ? dateMatch[1].trim() : date,
      returnDate: returnDate,
      bookingLink: isOneWay ? 
        `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}` :
        (returnDate ? 
          `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}%20return%20on%20${returnDate}` :
          `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}`
        ),
      error: 'Failed to parse Gemini response, using fallback extraction',
      fromAirports: [],
      toAirports: [],
      hasMultipleFromAirports: false,
      hasMultipleToAirports: false
    };

  } catch (error) {
    console.error('Error improving params with Gemini:', error);
    
    // Fallback to original parameters without database lookup
    return {
      from: from.trim(),
      to: to.trim(),
      fromAirportCode: from.trim().toUpperCase(),
      toAirportCode: to.trim().toUpperCase(),
      departureDate: date,
      returnDate: returnDate,
      bookingLink: isOneWay ? 
        `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}` :
        (returnDate ? 
          `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}%20return%20on%20${returnDate}` :
          `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${from.trim().toUpperCase()}%20to%20${to.trim().toUpperCase()}%20on%20${date}`
        ),
      error: `Gemini processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fromAirports: [],
      toAirports: [],
      hasMultipleFromAirports: false,
      hasMultipleToAirports: false
    };
  }
}

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
  stops: number;
  aircraft?: string;
  cabinClass?: string;
  baggage?: string;
  refundable?: boolean;
  link?: string;
  tripType?: 'outbound' | 'return'; // Добавляем тип рейса
}

interface SearchParams {
  from: string;
  to: string;
  date: string;
  returnDate?: string | null;
  passengers: number;
  cabinClass: string; // Single cabin class selection
  isOneWay: boolean;
  selectedFromAirports?: string[];
  selectedToAirports?: string[];

}

type SearchResult = {
  type: 'text';
  data: string;
} | {
  type: 'flights';
  data: Flight[];
  warning?: string;
};

export async function searchFlightsByParams(params: SearchParams): Promise<SearchResult> {
  console.log(' searchFlightsByParams called with:', {
    from: params.from,
    to: params.to,
    date: params.date,
    returnDate: params.returnDate,
    passengers: params.passengers,
    cabinClass: params.cabinClass,
    isOneWay: params.isOneWay
  });
  
  try {
    return await searchFlightsWithSerpAPI(params);
  } catch (error) {
    console.error('Error searching flights by params:', error);
    return { 
      type: 'text', 
      data: 'An error occurred while searching for flights. Please try again later.' 
    };
  }
}

export async function searchFlightsWithSerpAPI(params: SearchParams): Promise<SearchResult> {
  const { from, to, date, returnDate, passengers = 1, cabinClass, isOneWay } = params;
  
  console.log(' Starting flight search with params:', {
    from, to, date, returnDate, passengers, cabinClass, isOneWay,
    hasReturnDate: !!returnDate,
    returnDateType: typeof returnDate,
    returnDateLength: returnDate ? returnDate.length : 0,
    isRoundTrip: !isOneWay && !!returnDate && returnDate.trim() !== ''
  });
  
  // Log cabin class details
  console.log(' Cabin class details:', {
    cabinClass,
    type: typeof cabinClass
  });
  
  try {
    // Use Gemini to improve and normalize search parameters
    console.log(' Improving search parameters with Gemini...');
    const improvedParams = await improveSearchParamsWithGemini(from, to, date, returnDate ?? null, isOneWay);
    
    console.log(' Improved params with Gemini:', improvedParams);
    
    // Log validation warnings if any
    if (improvedParams.validationWarnings && improvedParams.validationWarnings.length > 0) {
      console.warn(' Gemini validation warnings:', improvedParams.validationWarnings);
    }
    
    if (improvedParams.error) {
      console.warn(' Gemini processing error:', improvedParams.error);
    }
    
    // Use improved parameters
    const normalizedFrom = improvedParams.from;
    const normalizedTo = improvedParams.to;
    const normalizedDate = improvedParams.departureDate;
    const normalizedReturnDate = improvedParams.returnDate || null;
    
    // Use airport codes from Gemini
    const departureAirport = improvedParams.fromAirportCode;
    const arrivalAirport = improvedParams.toAirportCode;
    
    if (!departureAirport || !arrivalAirport) {
      return {
        type: 'text',
        data: `Unable to find airport codes for ${normalizedFrom} or ${normalizedTo}. Please use major city names or airport codes.`
      };
    }
    
    // Check if we have multiple airports and need to search all combinations
    const fromAirports = improvedParams.fromAirports || [];
    const toAirports = improvedParams.toAirports || [];
    // Prefer explicit flags if present, otherwise infer from arrays
    const hasMultipleFrom = (improvedParams.hasMultipleFromAirports ?? (fromAirports.length > 1));
    const hasMultipleTo = (improvedParams.hasMultipleToAirports ?? (toAirports.length > 1));
    
    console.log(' Airport analysis:', {
      from: normalizedFrom,
      to: normalizedTo,
      hasMultipleFrom,
      hasMultipleTo,
      fromAirports: fromAirports.map(ap => `${ap.name} (${ap.code})`),
       toAirports: toAirports.map(ap => `${ap.name} (${ap.code})`),
       fromAirportsCount: fromAirports.length,
       toAirportsCount: toAirports.length
    });
    
         // If we have multiple airports, we'll search with multiple IDs in one request
    let airportCombinations: Array<{from: string, to: string, fromName: string, toName: string}> = [];
    
           // Apply user-selected filters - this is CRITICAL for respecting user choice
      const selectedFrom = Array.isArray(params.selectedFromAirports) && params.selectedFromAirports.length > 0
        ? fromAirports.filter(ap => params.selectedFromAirports!.includes(ap.code))
        : fromAirports;
      const selectedTo = Array.isArray(params.selectedToAirports) && params.selectedToAirports.length > 0
        ? toAirports.filter(ap => params.selectedToAirports!.includes(ap.code))
        : toAirports;

      console.log(' User airport selection:', {
      selectedFromAirports: params.selectedFromAirports,
        selectedToAirports: params.selectedToAirports,
        selectedFromCount: selectedFrom.length,
        selectedToCount: selectedTo.length,
        selectedFromCodes: selectedFrom.map(ap => ap.code),
        selectedToCodes: selectedTo.map(ap => ap.code),
        allAvailableFromAirports: fromAirports.map(ap => `${ap.code} (${ap.name})`),
        allAvailableToAirports: toAirports.map(ap => `${ap.code} (${ap.name})`)
      });

      // CRITICAL: Generate combinations ONLY for user-selected airports
      if (selectedFrom.length > 0 && selectedTo.length > 0) {
        // User has selected specific airports - use ONLY those
        for (const fromAp of selectedFrom) {
          for (const toAp of selectedTo) {
                airportCombinations.push({
                  from: fromAp.code,
                  to: toAp.code,
                  fromName: `${fromAp.name} (${fromAp.code})`,
                  toName: `${toAp.name} (${toAp.code})`
                });
              }
            }
        console.log(' Generated airport combinations based on USER SELECTION:', airportCombinations.length, 'combinations');
        console.log(' User-selected combinations:', airportCombinations.map(c => `${c.from} → ${c.to}`));
      } else if (params.selectedFromAirports && params.selectedFromAirports.length > 0) {
        // User selected departure airports but no arrival airports
        console.log(' User selected departure airports but no arrival airports - using main arrival airport');
        for (const fromAp of selectedFrom) {
                airportCombinations.push({
                  from: fromAp.code,
            to: arrivalAirport,
                  fromName: `${fromAp.name} (${fromAp.code})`,
            toName: normalizedTo
          });
        }
      } else if (params.selectedToAirports && params.selectedToAirports.length > 0) {
        // User selected arrival airports but no departure airports
        console.log(' User selected arrival airports but no departure airports - using main departure airport');
        for (const toAp of selectedTo) {
                airportCombinations.push({
            from: departureAirport,
                  to: toAp.code,
            fromName: normalizedFrom,
                  toName: `${toAp.name} (${toAp.code})`
                });
              }
        } else {
        // No user selection - use main airports only
        console.log(' No user airport selection - using main airports only');
        airportCombinations = [{
          from: departureAirport,
          to: arrivalAirport,
          fromName: normalizedFrom,
          toName: normalizedTo
        }];
      }
    
    console.log(' Final airport combinations to search:', airportCombinations);
    console.log(' Total combinations to search:', airportCombinations.length);
    
    // Log each combination for debugging
    airportCombinations.forEach((combo: {from: string, to: string, fromName: string, toName: string}, index: number) => {
      console.log(` Combination ${index + 1}: ${combo.from} (${combo.fromName}) → ${combo.to} (${combo.toName})`);
    });
    
    // Final summary of what will be searched
    console.log(' FINAL SEARCH SUMMARY:');
    console.log(`   - User selected ${params.selectedFromAirports?.length || 0} departure airports: ${params.selectedFromAirports?.join(', ') || 'none'}`);
    console.log(`   - User selected ${params.selectedToAirports?.length || 0} arrival airports: ${params.selectedToAirports?.join(', ') || 'none'}`);
    console.log(`   - Will search ${airportCombinations.length} combinations: ${airportCombinations.map(c => `${c.from}→${c.to}`).join(', ')}`);

    // Format date to YYYY-MM-DD using improved dates
    let dateObj = new Date(normalizedDate);
    
    // Check if date is in the past, if so use tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
      console.log(' Date is in the past, using tomorrow instead');
      dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + 1);
    }
    
    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    // Format return date - Google Flights API always requires return_date
    // For one-way flights, return_date should be the same as departure_date (user's date)
    let returnDateToUse: string;
    if (isOneWay) {
      // For one-way flights, use the same date as departure (user's date)
      returnDateToUse = normalizedDate;
    } else {
      // For round-trip flights, use the actual return date
      returnDateToUse = normalizedReturnDate || normalizedDate;
    }
    
    let returnDateObj = new Date(returnDateToUse);
    
    // Check if return date is in the past, if so use departure date (same date for one-way)
    if (returnDateObj < today) {
      console.log(' Return date is in the past, using departure date instead');
      returnDateObj = new Date(dateObj);
      returnDateToUse = returnDateObj.toISOString().split('T')[0];
    }
    
    // For one-way flights, ensure return date equals departure date
    if (isOneWay && returnDateObj.getTime() !== dateObj.getTime()) {
      console.log(' One-way flight: adjusting return date to match departure date');
      returnDateObj = new Date(dateObj);
      returnDateToUse = returnDateObj.toISOString().split('T')[0];
    }
    
    // For round-trip flights, ensure return date is not before departure date
    if (!isOneWay && returnDateObj < dateObj) {
      console.log(' Round-trip: return date is before departure date, adjusting return date');
      returnDateObj.setDate(dateObj.getDate() + 1);
      returnDateToUse = returnDateObj.toISOString().split('T')[0];
    }
    
    const formattedReturnDate = `${returnDateObj.getFullYear()}-${String(returnDateObj.getMonth() + 1).padStart(2, '0')}-${String(returnDateObj.getDate()).padStart(2, '0')}`;

    // Search for flights between all airport combinations
    const allFlights: Flight[] = [];
    
    console.log(` Starting search for ${airportCombinations.length} airport combinations...`);
    
     // Helper function to convert cabin class to number
      const getTravelClassNumber = (cabinClass: string): string => {
        switch (cabinClass) {
          case 'business': return '3';
          case 'first': return '4';
          default: return cabinClass;
        }
      };
      
      const travelClassParam = cabinClass === 'economy' ? '' : `&travel_class=${getTravelClassNumber(cabinClass)}`;
     
           // Instead of searching each combination individually, use one request with multiple airport IDs
      if (airportCombinations.length > 1) {
        console.log(' Using optimized search with multiple airport IDs in one request');
        
                 // Get unique departure and arrival airports from USER-SELECTED combinations
         const uniqueFromAirports = [...new Set(airportCombinations.map(c => c.from))];
         const uniqueToAirports = [...new Set(airportCombinations.map(c => c.to))];
         
         console.log(' User-selected unique departure airports:', uniqueFromAirports);
         console.log(' User-selected unique arrival airports:', uniqueToAirports);
         console.log(' User-selected combinations being searched:', airportCombinations.map(c => `${c.from} → ${c.to}`));
         console.log(' Total user-selected departure airports:', uniqueFromAirports.length);
         console.log(' Total user-selected arrival airports:', uniqueToAirports.length);
        
                 // Build one URL with multiple airport IDs - using ONLY user-selected airports
         const departureIds = uniqueFromAirports.join(',');
         const arrivalIds = uniqueToAirports.join(',');
        
        const searchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departureIds}&arrival_id=${arrivalIds}&outbound_date=${formattedDate}&return_date=${formattedReturnDate}&adults=${passengers}${travelClassParam}&currency=USD&hl=en&num=100&gl=us&api_key=${SERPAPI_KEY}`;
       
               console.log(' SerpAPI optimized URL with multiple airports:', searchUrl);
        console.log(` Travel class parameter: ${cabinClass}`);
        console.log(` Flight type: ${isOneWay ? 'One-way' : 'Round-trip'}`);
        console.log(` Departure: ${formattedDate}, Return: ${formattedReturnDate}`);
        console.log(` Gemini improved cities: ${normalizedFrom} → ${normalizedTo}`);
        
                 // Store URLs for final summary
         const searchUrls = [searchUrl];
         const returnSearchUrls: string[] = [];
        
                   try {
           // Make multiple requests to get more results - SAME STRATEGY AS RETURN FLIGHTS
           const allResults: Record<string, unknown>[] = [];
           
           // Multiple search strategies for outbound flights - IDENTICAL to return flights
           const outboundSearchStrategies = [
             { start: 0, sort_by: '1' },    // Top flights (default)
             { start: 100, sort_by: '2' },  // Price
             { start: 200, sort_by: '5' },  // Duration
             { start: 300, sort_by: '1' },  // Top flights (default)
             { start: 400, sort_by: '2' },  // Price
             { start: 500, sort_by: '5' }   // Duration
           ];
           
           console.log(` Making ${outboundSearchStrategies.length} outbound SerpAPI requests with multiple strategies...`);
           
           // Try each search strategy for outbound flights - SAME LOGIC AS RETURN FLIGHTS
           for (const outboundStrategy of outboundSearchStrategies) {
             try {
               const outboundSearchUrl = `${searchUrl}&start=${outboundStrategy.start}&sort_by=${outboundStrategy.sort_by}`;
               searchUrls.push(outboundSearchUrl);
               
               console.log(` Making outbound request with start=${outboundStrategy.start}, sort_by=${outboundStrategy.sort_by}...`);
               const outboundResponse = await fetch(outboundSearchUrl);
               
               if (outboundResponse.ok) {
                 const outboundData = await outboundResponse.json();
                 allResults.push(outboundData);
                 console.log(` Outbound request with start=${outboundStrategy.start}, sort_by=${outboundStrategy.sort_by} completed`);
                 
                 // Log what we found in this request
                 const bestFlightsCount = outboundData.best_flights && Array.isArray(outboundData.best_flights) ? outboundData.best_flights.length : 0;
                 const otherFlightsCount = outboundData.other_flights && Array.isArray(outboundData.other_flights) ? outboundData.other_flights.length : 0;
                 console.log(` Outbound request ${outboundStrategy.start}/${outboundStrategy.sort_by}: ${bestFlightsCount} best + ${otherFlightsCount} other flights`);
               } else {
                 console.log(` Outbound request with start=${outboundStrategy.start}, sort_by=${outboundStrategy.sort_by} failed: ${outboundResponse.status}`);
               }
               
               // Small delay to avoid rate limiting
               await new Promise(resolve => setTimeout(resolve, 100));
             } catch (outboundStrategyError) {
               console.log(` Error in outbound request with start=${outboundStrategy.start}, sort_by=${outboundStrategy.sort_by}:`, outboundStrategyError);
             }
           }
           
           console.log(` Completed ${allResults.length} outbound SerpAPI requests`);
           console.log(` Total outbound requests made: ${allResults.length}`);
          
                    // Merge results from all requests
          const mergedData = mergeSerpAPIResults(allResults);
          console.log(' SerpAPI response received');
          console.log(' Response structure:', Object.keys(mergedData));
          console.log(' Response details:', {
            bestFlightsCount: mergedData.best_flights ? (Array.isArray(mergedData.best_flights) ? mergedData.best_flights.length : 'not array') : 'not found',
            otherFlightsCount: mergedData.other_flights ? (Array.isArray(mergedData.other_flights) ? mergedData.other_flights.length : 'not array') : 'not found',
            totalResults: (mergedData.search_metadata as Record<string, unknown>)?.total_results || 'unknown',
            requestId: (mergedData.search_metadata as Record<string, unknown>)?.id || 'unknown'
          });
         
         // Process all flights from the response
         const allFlights: Flight[] = [];
         
         // Process best_flights
         if (mergedData.best_flights && Array.isArray(mergedData.best_flights)) {
           console.log(` Found ${mergedData.best_flights.length} best flights`);
           
           mergedData.best_flights.forEach((flightData: Record<string, unknown>, index: number) => {
             const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams);
             if (flight) {
               // Check if this flight matches any of our airport combinations
               const matchesCombination = airportCombinations.some(combo => 
                 flight.departure.airport === combo.from && flight.arrival.airport === combo.to
               );
               
               if (matchesCombination) {
                 allFlights.push(flight);
                 console.log(` Added best flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
               } else {
                 console.log(` Filtered out best flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport}) - doesn't match combinations`);
               }
             }
           });
         }
         
         // Process other_flights
         if (mergedData.other_flights && Array.isArray(mergedData.other_flights)) {
           console.log(` Found ${mergedData.other_flights.length} other flights`);
           
           mergedData.other_flights.forEach((flightData: Record<string, unknown>, index: number) => {
             const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams);
             if (flight) {
               // Check if this flight matches any of our airport combinations
               const matchesCombination = airportCombinations.some(combo => 
                 flight.departure.airport === combo.from && flight.arrival.airport === combo.to
               );
               
               if (matchesCombination) {
                 allFlights.push(flight);
                 console.log(` Added other flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
               } else {
                 console.log(` Filtered out other flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport}) - doesn't match combinations`);
               }
             }
           });
         }
         
                   // Remove duplicate flights before returning
          const uniqueOutboundFlights = removeDuplicateFlights(allFlights);
          console.log(` Optimized search completed: ${uniqueOutboundFlights.length} unique outbound flights found (filtered from ${allFlights.length})`);
          
          // Replace allFlights with deduplicated version
          allFlights.length = 0;
          allFlights.push(...uniqueOutboundFlights);
         
                             // For round-trip flights, search return flights with multiple optimized requests
          if (!isOneWay && normalizedReturnDate && normalizedReturnDate.trim() !== '') {
            console.log(' Searching return flights with multiple optimized requests...');
            
            // Build base return URL with reversed airports - using ONLY user-selected airports for return search
            // For return flights, we need a different return_date (next day) since SerpAPI requires return_date > outbound_date
            const returnReturnDate = new Date(formattedReturnDate);
            returnReturnDate.setDate(returnReturnDate.getDate() + 1);
            const formattedReturnReturnDate = `${returnReturnDate.getFullYear()}-${String(returnReturnDate.getMonth() + 1).padStart(2, '0')}-${String(returnReturnDate.getDate()).padStart(2, '0')}`;
            
                         const baseReturnSearchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${arrivalIds}&arrival_id=${departureIds}&outbound_date=${formattedReturnDate}&return_date=${formattedReturnReturnDate}&adults=${passengers}${travelClassParam}&currency=USD&hl=en&num=100&api_key=${SERPAPI_KEY}`;
            
             console.log(' Return flights base URL:', baseReturnSearchUrl);
             
             // Store return URLs for final summary
             const returnSearchUrls = [baseReturnSearchUrl];
            console.log(' Return flights URL details:', {
              departureIds,
              arrivalIds,
              outboundDate: formattedReturnDate,
              returnDate: formattedReturnReturnDate,
              passengers,
              cabinClass,
              travelClassParam
            });
           
                         try {
              // Make multiple requests to get more return flight results - SAME STRATEGY AS OUTBOUND FLIGHTS
              const allReturnResults: Record<string, unknown>[] = [];
              
                             // Multiple search strategies for return flights - IDENTICAL to outbound flights
               const returnSearchStrategies = [
                 { start: 0, sort_by: '1' },    // Top flights (default)
                 { start: 100, sort_by: '2' },  // Price
                 { start: 200, sort_by: '5' },  // Duration
                 { start: 300, sort_by: '1' },  // Top flights (default)
                 { start: 400, sort_by: '2' },  // Price
                 { start: 500, sort_by: '5' }   // Duration
               ];
              
              console.log(` Making ${returnSearchStrategies.length} return SerpAPI requests with multiple strategies...`);
              
              // Try each search strategy for return flights
              for (const returnStrategy of returnSearchStrategies) {
                try {
                  const returnSearchUrl = `${baseReturnSearchUrl}&start=${returnStrategy.start}&sort_by=${returnStrategy.sort_by}`;
                  returnSearchUrls.push(returnSearchUrl);
                  
                  console.log(` Making return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by}...`);
                  const returnResponse = await fetch(returnSearchUrl);
                  
                  if (returnResponse.ok) {
                    const returnData = await returnResponse.json();
                    allReturnResults.push(returnData);
                    console.log(` Return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by} completed`);
                    
                    // Log what we found in this request
                    const bestFlightsCount = returnData.best_flights && Array.isArray(returnData.best_flights) ? returnData.best_flights.length : 0;
                    const otherFlightsCount = returnData.other_flights && Array.isArray(returnData.other_flights) ? returnData.other_flights.length : 0;
                    console.log(` Return request ${returnStrategy.start}/${returnStrategy.sort_by}: ${bestFlightsCount} best + ${otherFlightsCount} other flights`);
                  } else {
                    console.log(` Return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by} failed: ${returnResponse.status}`);
                  }
                  
                  // Small delay to avoid rate limiting
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (returnStrategyError) {
                  console.log(` Error in return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by}:`, returnStrategyError);
                }
              }
              
              console.log(` Completed ${allReturnResults.length} return SerpAPI requests`);
              console.log(` Total return requests made: ${allReturnResults.length}`);
              
              // Merge return results from all requests
              const mergedReturnData = mergeSerpAPIResults(allReturnResults);
              console.log(' Return flights response merged');
              
              // Process merged return flights
              if (mergedReturnData.best_flights && Array.isArray(mergedReturnData.best_flights)) {
                console.log(` Found ${mergedReturnData.best_flights.length} return best flights (merged)`);
                
                mergedReturnData.best_flights.forEach((flightData: Record<string, unknown>, index: number) => {
                  const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams);
                  if (flight) {
                    // Check if this flight matches any of our return route combinations
                    const matchesReturnCombination = airportCombinations.some(combo => 
                      flight.departure.airport === combo.to && flight.arrival.airport === combo.from
                    );
                    
                    if (matchesReturnCombination) {
                      allFlights.push(flight);
                      console.log(` Added return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
                    } else {
                      console.log(` Filtered out return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport}) - doesn't match return combinations`);
                    }
                  }
                });
              }
              
              if (mergedReturnData.other_flights && Array.isArray(mergedReturnData.other_flights)) {
                console.log(` Found ${mergedReturnData.other_flights.length} return other flights (merged)`);
                
                mergedReturnData.other_flights.forEach((flightData: Record<string, unknown>, index: number) => {
                  const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams);
                  if (flight) {
                    // Check if this flight matches any of our return route combinations
                    const matchesReturnCombination = airportCombinations.some(combo => 
                      flight.departure.airport === combo.to && flight.arrival.airport === combo.from
                    );
                    
                    if (matchesReturnCombination) {
                      allFlights.push(flight);
                      console.log(` Added return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
                    } else {
                      console.log(` Filtered out return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport}) - doesn't match return combinations`);
                    }
                  }
                });
              }
              
                                                       // Remove duplicate return flights
                            const returnFlights = allFlights.filter(f => f.tripType === 'return');
                            const uniqueReturnFlights = removeDuplicateFlights(returnFlights);
                            console.log(` Return flights search completed: ${uniqueReturnFlights.length} unique return flights found (filtered from ${returnFlights.length})`);
                            
                            // Replace return flights with deduplicated version
                            const outboundFlights = allFlights.filter(f => f.tripType === 'outbound');
                            allFlights.length = 0;
                            allFlights.push(...outboundFlights, ...uniqueReturnFlights);
             
             // Log return search URLs for debugging
             console.log(' RETURN FLIGHTS URLs:');
             returnSearchUrls.forEach((url: string, index: number) => {
               console.log(`  ${index + 1}. ${url}`);
             });
           } catch (returnError) {
             console.error(' Error searching return flights:', returnError);
           }
           }
          
                     // Log all search URLs for debugging
           console.log('\n ALL SEARCH URLS USED:');
           console.log(' OUTBOUND FLIGHTS:');
           console.log(`  Base URL: ${searchUrl}`);
           console.log(`  Strategies used: ${outboundSearchStrategies.length} (start: 0,100,200,300,400,500; sort_by: 1,2,5)`);
           searchUrls.forEach((url: string, index: number) => {
             console.log(`  ${index + 1}. ${url}`);
           });
          
          if (returnSearchUrls && returnSearchUrls.length > 0) {
            console.log(' RETURN FLIGHTS:');
            returnSearchUrls.forEach((url: string, index: number) => {
              console.log(`  ${index + 1}. ${url}`);
            });
          }
          console.log(`\n Total URLs used: ${searchUrls.length + (returnSearchUrls ? returnSearchUrls.length : 0)}`);
          
          // Return results
          try {
           logFlightSearchSummary(
             { from, to, date, returnDate: returnDate ?? null, passengers, cabinClass, isOneWay },
             improvedParams,
             allFlights,
             improvedParams.validationWarnings
           );
         } catch (loggingError) {
           console.warn(' Error in detailed logging, continuing with basic info:', loggingError);
           console.log(` Search completed: ${allFlights.length} flights found`);
         }
         
         return {
           type: 'flights',
           data: allFlights
         };
         
       } catch (error) {
         console.error(' Error in optimized search:', error);
         console.log(' Falling back to individual searches...');
       }
     }
     
     // Fallback to individual searches if optimized search fails or for single combinations
     console.log(' Using individual search approach...');
     
     for (const combination of airportCombinations) {
       console.log(` Searching flights: ${combination.fromName} → ${combination.toName}`);
       console.log(` Progress: ${airportCombinations.indexOf(combination) + 1}/${airportCombinations.length}`);

    // Build Google Flights API URL with correct parameters
    // Google Flights API always requires return_date parameter
               const searchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${combination.from}&arrival_id=${combination.to}&outbound_date=${formattedDate}&return_date=${formattedReturnDate}&adults=${passengers}${travelClassParam}&currency=USD&hl=en&num=100&gl=us&api_key=${SERPAPI_KEY}`;
    
    console.log(' SerpAPI google_flights URL:', searchUrl);
      console.log(` Travel class parameter: ${cabinClass}`);
    console.log(` Flight type: ${isOneWay ? 'One-way' : 'Round-trip'}`);
    console.log(` Departure: ${formattedDate}, Return: ${formattedReturnDate}`);
    console.log(` Gemini improved cities: ${normalizedFrom} → ${normalizedTo}`);
    console.log(` Gemini improved dates: ${normalizedDate} → ${normalizedReturnDate || 'one-way'}`);
    console.log(` Date validation: departure=${dateObj.toISOString()}, return=${returnDateObj.toISOString()}`);
    console.log(` Is return date in past: ${returnDateObj < today}`);
    console.log(` Is return before departure: ${returnDateObj < dateObj}`);
      console.log(` Searching route: ${combination.from} → ${combination.to}`);
    
      try {
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
          console.log(` SerpAPI google_flights error for ${combination.from} → ${combination.to}: ${response.status} - ${response.statusText}`);
          continue; // Try next combination
    }
    
    const data = await response.json();
        console.log(` SerpAPI response received for ${combination.from} → ${combination.to}`);
    console.log(' Full response structure:', Object.keys(data));
    
    // Process Google Flights results - check both best_flights and other_flights
        const combinationFlights: Flight[] = [];
    
    // Log detailed structure of flight data
    if (data.best_flights) {
      console.log(' best_flights structure:', typeof data.best_flights, Array.isArray(data.best_flights) ? data.best_flights.length : 'not array');
      
      // Log first flight item structure
      if (Array.isArray(data.best_flights) && data.best_flights.length > 0) {
        const firstFlight = data.best_flights[0];
        console.log(' First best_flight item keys:', Object.keys(firstFlight));
      }
    }
    
    if (data.other_flights) {
      console.log(' other_flights structure:', typeof data.other_flights, Array.isArray(data.other_flights) ? data.other_flights.length : 'not array');
      
      // Log first flight item structure
      if (Array.isArray(data.other_flights) && data.other_flights.length > 0) {
        const firstFlight = data.other_flights[0];
        console.log(' First other_flight item keys:', Object.keys(firstFlight));
      }
    }
    
    // Check best_flights
    if (data.best_flights && Array.isArray(data.best_flights) && data.best_flights.length > 0) {
          console.log(` Found ${data.best_flights.length} best flights for ${combination.from} → ${combination.to}`);
      const bestFlights = data.best_flights.map((flightData: Record<string, unknown>) => 
        createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams)
      ).filter(Boolean);
      
      // Validate outbound flights to ensure they match the requested route
      const validatedBestFlights = bestFlights.filter((flight: Flight) => {
            const isCorrectRoute = flight.departure.airport === combination.from && flight.arrival.airport === combination.to;
        if (!isCorrectRoute) {
              console.warn(` Filtered out incorrect outbound flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${combination.from} → ${combination.to})`);
        }
        return isCorrectRoute;
      });
      
      console.log(` Processed ${validatedBestFlights.length} valid best flights (filtered from ${bestFlights.length})`);
          combinationFlights.push(...validatedBestFlights);
    }
    
    // Check other_flights
    if (data.other_flights && Array.isArray(data.other_flights) && data.other_flights.length > 0) {
          console.log(` Found ${data.other_flights.length} other flights for ${combination.from} → ${combination.to}`);
      const otherFlights = data.other_flights.map((flightData: Record<string, unknown>) => 
        createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams)
      ).filter(Boolean);
      
      // Validate other outbound flights to ensure they match the requested route
      const validatedOtherFlights = otherFlights.filter((flight: Flight) => {
            const isCorrectRoute = flight.departure.airport === combination.from && flight.arrival.airport === combination.to;
        if (!isCorrectRoute) {
              console.warn(` Filtered out incorrect outbound flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${combination.from} → ${combination.to})`);
        }
        return isCorrectRoute;
      });
      
      console.log(` Processed ${validatedOtherFlights.length} valid other flights (filtered from ${otherFlights.length})`);
          combinationFlights.push(...validatedOtherFlights);
        }
        
        // Add combination flights to total
        allFlights.push(...combinationFlights);
        console.log(` Added ${combinationFlights.length} flights from ${combination.from} → ${combination.to}`);
        
                 // For round-trip flights, also search for return flights with multiple strategies
    if (!isOneWay && normalizedReturnDate && normalizedReturnDate.trim() !== '') {
           console.log(` Searching return flights: ${combination.toName} → ${combination.fromName}`);
      
           // Search for return flights (reverse direction) with multiple strategies - SAME AS OUTBOUND
      // For return flights, we need to use the return date as the main departure date
      // and set a future return date (since we're looking for flights FROM destination TO origin)
      const returnOutboundDate = formattedReturnDate; // This is when we want to leave the destination
      const returnReturnDate = new Date(formattedReturnDate);
      returnReturnDate.setDate(returnReturnDate.getDate() + 1); // Add 1 day for the return
      const formattedReturnReturnDate = `${returnReturnDate.getFullYear()}-${String(returnReturnDate.getMonth() + 1).padStart(2, '0')}-${String(returnReturnDate.getDate()).padStart(2, '0')}`;
      
           const returnTravelClassParam = cabinClass === 'economy' ? '' : `&travel_class=${getTravelClassNumber(cabinClass)}`;
           
           // Build base return URL
           const baseReturnSearchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${combination.to}&arrival_id=${combination.from}&outbound_date=${returnOutboundDate}&return_date=${formattedReturnReturnDate}&adults=${passengers}${returnTravelClassParam}&currency=USD&hl=en&num=100&api_key=${SERPAPI_KEY}`;
      
      console.log(' Return flights search details:', {
             departure: combination.to, // From destination
             arrival: combination.from, // To origin
        outboundDate: returnOutboundDate, // When we leave destination
        returnDate: formattedReturnReturnDate // Next day (required by API)
      });
           console.log(' Return flights base URL:', baseReturnSearchUrl);
           console.log(` Return flights travel class parameter: ${cabinClass}`);
           
           try {
             // Make multiple requests to get more return flight results - SAME STRATEGY AS OUTBOUND FLIGHTS
             const allReturnResults: Record<string, unknown>[] = [];
             
             // Multiple search strategies for return flights - IDENTICAL to outbound flights
             const returnSearchStrategies = [
               { start: 0, sort_by: '1' },    // Top flights (default)
               { start: 100, sort_by: '2' },  // Price
               { start: 200, sort_by: '5' },  // Duration
               { start: 300, sort_by: '1' },  // Top flights (default)
               { start: 400, sort_by: '2' },  // Price
               { start: 500, sort_by: '5' }   // Duration
             ];
             
             console.log(` Making ${returnSearchStrategies.length} return SerpAPI requests with multiple strategies...`);
             
             // Try each search strategy for return flights - SAME LOGIC AS OUTBOUND
             for (const returnStrategy of returnSearchStrategies) {
               try {
                 const returnSearchUrl = `${baseReturnSearchUrl}&start=${returnStrategy.start}&sort_by=${returnStrategy.sort_by}`;
                 
                 console.log(` Making return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by}...`);
        const returnResponse = await fetch(returnSearchUrl);
        
        if (returnResponse.ok) {
          const returnData = await returnResponse.json();
                   allReturnResults.push(returnData);
                   console.log(` Return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by} completed`);
                   
                   // Log what we found in this request
                   const bestFlightsCount = returnData.best_flights && Array.isArray(returnData.best_flights) ? returnData.best_flights.length : 0;
                   const otherFlightsCount = returnData.other_flights && Array.isArray(returnData.other_flights) ? returnData.other_flights.length : 0;
                   console.log(` Return request ${returnStrategy.start}/${returnStrategy.sort_by}: ${bestFlightsCount} best + ${otherFlightsCount} other flights`);
                 } else {
                   console.log(` Return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by} failed: ${returnResponse.status}`);
                 }
                 
                 // Small delay to avoid rate limiting
                 await new Promise(resolve => setTimeout(resolve, 100));
               } catch (returnStrategyError) {
                 console.log(` Error in return request with start=${returnStrategy.start}, sort_by=${returnStrategy.sort_by}:`, returnStrategyError);
               }
             }
             
             console.log(` Completed ${allReturnResults.length} return SerpAPI requests`);
             console.log(` Total return requests made: ${allReturnResults.length}`);
             
             // Merge return results from all requests - SAME MERGING LOGIC AS OUTBOUND
             const mergedReturnData = mergeSerpAPIResults(allReturnResults);
             console.log(' Return flights response merged');
             
             // Process merged return flights - SAME PROCESSING LOGIC AS OUTBOUND
             if (mergedReturnData.best_flights && Array.isArray(mergedReturnData.best_flights)) {
               console.log(` Found ${mergedReturnData.best_flights.length} return best flights (merged)`);
               
               mergedReturnData.best_flights.forEach((flightData: Record<string, unknown>, index: number) => {
                 const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams);
                 if (flight) {
            // Additional validation: ensure flights are actually on the return route
                   const isCorrectRoute = flight.departure.airport === combination.to && flight.arrival.airport === combination.from;
                   if (isCorrectRoute) {
                     allFlights.push(flight);
                     console.log(` Added return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
                   } else {
                     console.warn(` Filtered out incorrect return flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${combination.to} → ${combination.from})`);
                   }
                 }
               });
             }
             
             if (mergedReturnData.other_flights && Array.isArray(mergedReturnData.other_flights)) {
               console.log(` Found ${mergedReturnData.other_flights.length} return other flights (merged)`);
               
               mergedReturnData.other_flights.forEach((flightData: Record<string, unknown>, index: number) => {
                 const flight = createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams);
                 if (flight) {
                   // Additional validation: ensure flights are actually on the return route
                   const isCorrectRoute = flight.departure.airport === combination.to && flight.arrival.airport === combination.from;
                   if (isCorrectRoute) {
                     allFlights.push(flight);
                     console.log(` Added return flight ${index + 1}: ${flight.airline} ${flight.flightNumber} (${flight.departure.airport} → ${flight.arrival.airport})`);
          } else {
                     console.warn(` Filtered out incorrect return flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${combination.to} → ${combination.from})`);
                   }
                 }
               });
             }
             
                           // Remove duplicate return flights for this combination
              const returnFlights = allFlights.filter(f => f.tripType === 'return');
              const uniqueReturnFlights = removeDuplicateFlights(returnFlights);
              console.log(` Return flights for ${combination.to} → ${combination.from}: ${uniqueReturnFlights.length} unique flights (filtered from ${returnFlights.length})`);
              
              // Replace return flights with deduplicated version
              const outboundFlights = allFlights.filter(f => f.tripType === 'outbound');
              allFlights.length = 0;
              allFlights.push(...outboundFlights, ...uniqueReturnFlights);
          
          // Log total return flights found
          const totalReturnFlights = allFlights.filter(f => f.tripType === 'return').length;
              console.log(` Total return flights found: ${totalReturnFlights}`);
             
             // Log return search URLs for debugging
             console.log(' RETURN FLIGHTS URLs (individual search):');
             console.log(`  Base URL: ${baseReturnSearchUrl}`);
             console.log(`  Strategies used: ${returnSearchStrategies.length} (start: 0,100,200,300,400,500; sort_by: best,price,duration)`);
      } catch (returnError) {
        console.error(' Error searching return flights:', returnError);
        console.error(' Return error details:', {
          message: returnError instanceof Error ? returnError.message : 'Unknown error',
          stack: returnError instanceof Error ? returnError.stack : 'No stack trace'
        });
        // Continue with outbound flights only
      }
    } else {
      console.log(' Skipping return flights search:', {
        isOneWay, 
             returnDate: normalizedReturnDate, 
             hasReturnDate: !!normalizedReturnDate,
             returnDateLength: normalizedReturnDate ? normalizedReturnDate.length : 0 
           });
         }
        
        console.log(` Completed search for combination ${airportCombinations.indexOf(combination) + 1}/${airportCombinations.length}: ${combination.from} → ${combination.to}`);
        console.log(` Total flights found so far: ${allFlights.length}`);
      } catch (error) {
        console.error(` Error searching flights for ${combination.from} → ${combination.to}:`, error);
        continue; // Try next combination
      }
    }
    
         // Final deduplication of all flights before returning
     const totalFlightsBeforeDedup = allFlights.length;
     const finalUniqueFlights = removeDuplicateFlights(allFlights);
     console.log(` Final deduplication: ${finalUniqueFlights.length} unique flights (filtered from ${totalFlightsBeforeDedup})`);
     
     // Check if we found any flights
     if (finalUniqueFlights.length > 0) {
       console.log(` Total unique flights found: ${finalUniqueFlights.length}`);
      
      try {
        // Log comprehensive search summary
        logFlightSearchSummary(
           { from, to, date, returnDate: returnDate ?? null, passengers, cabinClass: cabinClass, isOneWay },
          improvedParams,
           finalUniqueFlights,
          improvedParams.validationWarnings
        );
      } catch (loggingError) {
        console.warn(' Error in detailed logging, continuing with basic info:', loggingError);
         console.log(` Search completed: ${finalUniqueFlights.length} flights found`);
      }
      
      return {
        type: 'flights',
         data: finalUniqueFlights
      };
    }
    
    console.log(' No flights found in any airport combination');
    return {
      type: 'text',
      data: 'No flights found for the specified route and date.'
    };
    
  } catch (error) {
    console.error(' Error searching flights with SerpAPI:', error);
    return {
      type: 'text',
      data: 'An error occurred while searching for flights. Please try again.'
    };
  }
}

// Function to create Flight object from structured SerpAPI google_flights data
function createFlightFromSerpAPIFlights(flightData: Record<string, unknown>, cabinClass: string, tripType: 'outbound' | 'return', improvedParams: Record<string, unknown>): Flight | null {
  try {
    console.log(' Processing flight data:', JSON.stringify(flightData, null, 2).substring(0, 500));
    console.log(' Flight data keys:', Object.keys(flightData));
    
    // SerpAPI returns flight items that contain a flights array
    if (!flightData.flights || !Array.isArray(flightData.flights) || flightData.flights.length === 0) {
      console.log(' No flights array found in flight data');
      console.log(' flightData.flights:', flightData.flights);
  return null;
}

    console.log(' Flights array length:', (flightData.flights as unknown[]).length);
    
    // Get the first flight from the array (for round trips, this is the outbound flight)
    const firstFlight = flightData.flights[0] as Record<string, unknown>;
    console.log(' First flight keys:', Object.keys(firstFlight));
    
    // Extract airline and flight number
    const airline = (firstFlight.airline as string) || 'Unknown Airline';
    const flightNumber = (firstFlight.flight_number as string) || 'Unknown';
    
    console.log(' Extracted airline:', airline, 'flight number:', flightNumber);
    
    // Extract departure and arrival information
    const departure = firstFlight.departure_airport as Record<string, unknown>;
    const arrival = firstFlight.arrival_airport as Record<string, unknown>;
    
    console.log(' Departure data:', departure);
    console.log(' Arrival data:', arrival);
    
    if (!departure || !arrival) {
      console.log(' Missing departure or arrival data in first flight');
  return null;
}

    const departureTime = (departure.time as string) || 'TBD';
    const arrivalTime = (arrival.time as string) || 'TBD';
    const departureAirport = (departure.id as string) || 'Unknown';
    const arrivalAirport = (arrival.id as string) || 'Unknown';
    
    // Extract date from departure time (format: "2025-08-16 12:40")
    const departureDate = departureTime.split(' ')[0] || new Date().toISOString().split('T')[0];
    const arrivalDate = arrivalTime.split(' ')[0] || departureDate;
    
    // Extract price and duration from the flight item
    const price = (flightData.price as string) || (flightData.price as number)?.toString() || 'Check price';
    const durationMinutes = (firstFlight.duration as number) || 0;
    const duration = formatDuration(durationMinutes);
    
    // Extract aircraft type
    const aircraft = (firstFlight.airplane as string) || undefined;
    
    // Extract cabin class from SerpAPI data or use provided parameter
    // SerpAPI returns travel_class as numbers: 3 for business, 4 for first
    let serpCabinClass: string;
    if (firstFlight.travel_class) {
      const travelClassValue = firstFlight.travel_class;
      if (typeof travelClassValue === 'number') {
        // Convert number to string representation
        switch (travelClassValue) {
          case 3: serpCabinClass = 'business'; break;
          case 4: serpCabinClass = 'first'; break;
          default: serpCabinClass = 'economy'; break;
        }
      } else if (typeof travelClassValue === 'string') {
        serpCabinClass = travelClassValue.toLowerCase();
      } else {
        serpCabinClass = 'economy';
      }
    } else {
      serpCabinClass = 'economy';
    }
    
    // Always use the requested cabin class from user, not from SerpAPI
    // This ensures consistency with what user actually selected
    const finalCabinClass = cabinClass;
    
    // Log cabin class information for debugging
    console.log(' Cabin class processing:', {
      serpCabinClass,
      requestedCabinClass: cabinClass,
      finalCabinClass,
      tripType
    });
    
    // Calculate stops (number of flights - 1 for multi-city)
    const stops = (flightData.flights as unknown[]).length - 1;
    
    // Create Flight object
    const flight: Flight = {
      airline,
      flightNumber: `${airline} ${flightNumber}${tripType === 'return' ? ' (Return)' : ''}`,
      departure: {
        airport: departureAirport,
        city: extractCityFromAirport(departure.name as string) || 'Unknown',
        time: departureTime.split(' ')[1] || departureTime, // Extract only time part
        date: departureDate
      },
      arrival: {
        airport: arrivalAirport,
        city: extractCityFromAirport(arrival.name as string) || 'Unknown',
        time: arrivalTime.split(' ')[1] || arrivalTime, // Extract only time part
        date: arrivalDate
      },
      duration,
      price,
      stops,
      aircraft,
      cabinClass: finalCabinClass,
      tripType, // Сохраняем тип рейса
      // Create specific flight link with exact parameters
      link: createSpecificFlightLink(
        departureAirport,
        arrivalAirport,
        departureDate,
        arrivalDate,
        airline,
        flightNumber,
        finalCabinClass,
        tripType
      )
    };
    
    // Additional validation: log route information for debugging
    if (tripType === 'return') {
      console.log(` Return flight route validation: ${departureAirport} → ${arrivalAirport}`);
    } else if (tripType === 'outbound') {
      console.log(` Outbound flight route validation: ${departureAirport} → ${arrivalAirport}`);
    }
    
    console.log(' Created flight:', flight.flightNumber, flight.airline, flight.departure.time, flight.arrival.time);
    return flight;
    
  } catch (error) {
    console.error(' Error creating flight from SerpAPI data:', error);
  return null;
  }
}

// Helper function to extract city name from airport name
function extractCityFromAirport(airportName: string): string {
  if (!airportName) return 'Unknown';
  
  // Удаляем "International Airport", "Airport" и другие общие суффиксы
  let city = airportName
    .replace(/ International Airport$/, '')
    .replace(/ Airport$/, '')
    .replace(/ Regional$/, '')
    .replace(/ Municipal$/, '');
    
  // Для специфических аэропортов
  if (airportName.includes('JFK') || airportName.includes('LaGuardia') || airportName.includes('Newark')) {
    return 'New York City'; // Используем более точное название для избежания путаницы
  }
  
  // Добавляем ", USA" для американских городов, чтобы избежать путаницы с городами в других странах
  if (airportName.includes('USA') || 
      ['JFK', 'LaGuardia', 'Newark', 'LAX', 'SFO', 'MIA', 'ORD', 'DFW'].some(code => airportName.includes(code))) {
    return `${city}, USA`;
  }
  
  return city;
}

// Helper function to format duration from minutes to readable format
function formatDuration(minutes: number): string {
  if (minutes <= 0) return 'TBD';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
        } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

// Function to log comprehensive flight search summary
function logFlightSearchSummary(
  params: SearchParams,
  improvedParams: Record<string, unknown>,
  flights: Flight[],
  warnings?: string[]
): void {
  console.log(' Flight Search Summary:');
  console.log(' Route:', `${params.from} → ${params.to}`);
  console.log(' Dates:', `${params.date}${params.returnDate ? ` → ${params.returnDate}` : ''}`);
  console.log(' Passengers:', params.passengers);
  console.log(' Cabin Class:', Array.isArray(params.cabinClass) ? params.cabinClass.join(', ') : params.cabinClass);
  console.log(' Flight Type:', params.isOneWay ? 'One-way' : 'Round-trip');
  console.log(' Total Flights Found:', flights.length);
  
  if (warnings && warnings.length > 0) {
    console.log(' Warnings:', warnings);
  }
  
  // Log flight statistics
  const outboundFlights = flights.filter(f => f.tripType === 'outbound');
  const returnFlights = flights.filter(f => f.tripType === 'return');
  
  console.log(' Outbound Flights:', outboundFlights.length);
  console.log(' Return Flights:', returnFlights.length);
  
  // Log price statistics
  const prices = flights
    .map(f => {
      const priceStr = String(f.price || '');
      const priceMatch = priceStr.match(/\$?(\d+(?:,\d+)*)/);
      return priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;
    })
    .filter(p => p !== null) as number[];
  
  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
    
    console.log(' Price Range:', `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`);
    console.log(' Average Price:', `$${avgPrice.toLocaleString()}`);
  }
  
  // Log airline statistics
  const airlines = new Set(flights.map(f => f.airline));
  console.log(' Airlines:', Array.from(airlines).join(', '));
}

// Helper function to extract stops information from flight data
function extractStopsFromResult(flightData: Record<string, unknown>): number {
  // Check for direct stops information
  if (typeof flightData.stops === 'number') {
    return flightData.stops;
  }
  
  // Check for layovers
  if (flightData.layovers && Array.isArray(flightData.layovers)) {
    return (flightData.layovers as unknown[]).length;
  }
  
  // Check for multi-city flights
  if (flightData.flights && Array.isArray(flightData.flights)) {
    const flightsArray = flightData.flights as unknown[];
    return Math.max(0, flightsArray.length - 1);
  }
  
  // Default to direct flight
  return 0;
}

// Function to calculate real flight duration
function calculateRealDuration(departureTime: string, arrivalTime: string): string | null {
  try {
    const [depHour, depMin] = departureTime.split(':').map(Number);
    const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
    
    let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // If flight crosses midnight
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  } catch {
    return null; // Return null if we can't calculate
  }
}

// Function to extract numeric price
function extractNumericPrice(price: string | number | unknown): number | null {
  // Handle different price types
  if (typeof price === 'number') {
    return price;
  }
  
  if (typeof price === 'string') {
    const match = price.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
  }
  
  return null;
}

// Function to extract airport code from city name
function extractAirportCode(city: string): string | null {
  return city.toUpperCase();
}

// Function to validate and fix airport codes from Gemini
function validateAirportCode(airportCode: string | undefined): string | null {
  if (!airportCode) return null;
  
  // Check if it's a valid IATA code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(airportCode)) {
    return airportCode;
  }
  
  // Check if it's a common abbreviation that needs conversion
  const abbreviationMap: Record<string, string> = {
    'NYC': 'JFK',
    'LA': 'LAX',
    'SF': 'SFO',
    'DC': 'IAD',
    'CHI': 'ORD',
    'MIA': 'MIA',
    'ATL': 'ATL',
    'BOS': 'BOS',
    'PHL': 'PHL',
    'DTW': 'DTW',
    'MSP': 'MSP',
    'DEN': 'DEN',
    'LAS': 'LAS',
    'PHX': 'PHX',
    'IAH': 'IAH',
    'DFW': 'DFW',
    'SEA': 'SEA',
    'PDX': 'PDX',
    'MCO': 'MCO',
    'TPA': 'TPA',
    'FLL': 'FLL',
    'EWR': 'EWR',
    'BWI': 'BWI',
    'CLE': 'CLE',
    'CVG': 'CVG',
    'PIT': 'PIT',
    'STL': 'STL',
    'MCI': 'MCI',
    'MKE': 'MKE',
    'IND': 'IND',
    'CMH': 'CMH',
    'BNA': 'BNA',
    'MEM': 'MEM',
    'MSY': 'MSY',
    'AUS': 'AUS',
    'SAT': 'SAT'
  };
  
  const normalizedCode = airportCode.toUpperCase();
  return abbreviationMap[normalizedCode] || null;
}

// Enhanced validation function for Gemini responses
function validateGeminiResponse(parsed: Record<string, unknown>, originalParams: { from: string; to: string; date: string; returnDate?: string | null; isOneWay: boolean }): {
  isValid: boolean;
  errors: string[];
  correctedParams: Record<string, unknown>;
} {
  const errors: string[] = [];
  const correctedParams = { ...parsed };
  
  console.log(' Validating Gemini response:', {
    original: originalParams,
    gemini: parsed
  });
  
     // 1. Validate airport codes format (must be 3 uppercase letters)
   if (parsed.fromAirportCode && typeof parsed.fromAirportCode === 'string') {
    if (!/^[A-Z]{3}$/.test(parsed.fromAirportCode)) {
       errors.push(`Invalid departure airport code format: ${parsed.fromAirportCode} - must be 3 uppercase letters (e.g., JFK, LAX)`);
      const corrected = validateAirportCode(parsed.fromAirportCode);
      if (corrected) {
        correctedParams.fromAirportCode = corrected;
        console.log(' Corrected departure airport code:', parsed.fromAirportCode, '→', corrected);
      } else {
        errors.push(`Could not correct departure airport code: ${parsed.fromAirportCode}`);
      }
    }
  }
  
   if (parsed.toAirportCode && typeof parsed.toAirportCode === 'string') {
    if (!/^[A-Z]{3}$/.test(parsed.toAirportCode)) {
       errors.push(`Invalid arrival airport code format: ${parsed.toAirportCode} - must be 3 uppercase letters (e.g., JFK, LAX)`);
      const corrected = validateAirportCode(parsed.toAirportCode);
      if (corrected) {
        correctedParams.toAirportCode = corrected;
        console.log(' Corrected arrival airport code:', parsed.toAirportCode, '→', corrected);
      } else {
        errors.push(`Could not correct arrival airport code: ${parsed.toAirportCode}`);
      }
    }
  }
  
   // 2. Validate that airport codes are not the same
   if (parsed.fromAirportCode === parsed.toAirportCode && parsed.fromAirportCode && parsed.toAirportCode && typeof parsed.fromAirportCode === 'string' && typeof parsed.toAirportCode === 'string') {
     errors.push(`Departure and arrival airports cannot be the same: ${parsed.fromAirportCode}`);
     // Use original values as fallback
     correctedParams.fromAirportCode = originalParams.from.toUpperCase();
     correctedParams.toAirportCode = originalParams.to.toUpperCase();
     console.log(' Corrected duplicate airport codes');
   }
  
     // 3. Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
   if (parsed.departureDate && typeof parsed.departureDate === 'string' && !dateRegex.test(parsed.departureDate)) {
    errors.push(`Invalid departure date format: ${parsed.departureDate}`);
    correctedParams.departureDate = originalParams.date;
    console.log(' Corrected departure date:', parsed.departureDate, '→', originalParams.date);
  }
  
   if (parsed.returnDate && typeof parsed.returnDate === 'string' && parsed.returnDate !== 'null' && !dateRegex.test(parsed.returnDate)) {
    errors.push(`Invalid return date format: ${parsed.returnDate}`);
    correctedParams.returnDate = originalParams.returnDate;
    console.log(' Corrected return date:', parsed.returnDate, '→', originalParams.returnDate);
  }
  
   // 4. Validate city names (should not be empty or too short)
   if (!parsed.from || typeof parsed.from !== 'string' || parsed.from.trim().length < 2) {
    errors.push(`Invalid departure city: ${parsed.from}`);
    correctedParams.from = originalParams.from;
    console.log(' Corrected departure city:', parsed.from, '→', originalParams.from);
  }
  
   if (!parsed.to || typeof parsed.to !== 'string' || parsed.to.trim().length < 2) {
    errors.push(`Invalid arrival city: ${parsed.to}`);
    correctedParams.to = originalParams.to;
    console.log(' Corrected arrival city:', parsed.to, '→', originalParams.to);
  }
  
   // 5. Validate booking link format
   if (parsed.bookingLink && typeof parsed.bookingLink === 'string') {
    if (!parsed.bookingLink.startsWith('https://www.google.com/travel/flights')) {
      errors.push(`Invalid booking link format: ${parsed.bookingLink}`);
      // Generate correct booking link
      const fromCode = correctedParams.fromAirportCode || originalParams.from.toUpperCase();
      const toCode = correctedParams.toAirportCode || originalParams.to.toUpperCase();
      const depDate = correctedParams.departureDate || originalParams.date;
      const retDate = correctedParams.returnDate || originalParams.returnDate;
      
      if (originalParams.isOneWay) {
        correctedParams.bookingLink = `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${fromCode}%20to%20${toCode}%20on%20${depDate}`;
      } else {
        correctedParams.bookingLink = `https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20${fromCode}%20to%20${toCode}%20on%20${depDate}%20return%20on%20${retDate}`;
      }
      console.log(' Generated correct booking link');
    }
  }
  
   // 6. Validate logical consistency
   if (parsed.departureDate && typeof parsed.departureDate === 'string' && parsed.returnDate && typeof parsed.returnDate === 'string' && parsed.returnDate !== 'null') {
    const depDate = new Date(parsed.departureDate);
    const retDate = new Date(parsed.returnDate);
    
    if (retDate <= depDate) {
      errors.push(`Return date (${parsed.returnDate}) must be after departure date (${parsed.departureDate})`);
      // For one-way flights, set return date to departure date
      if (originalParams.isOneWay) {
        correctedParams.returnDate = parsed.departureDate;
        console.log(' Corrected return date for one-way flight');
      }
    }
  }
  
  const isValid = errors.length === 0;
  
  console.log(' Gemini validation result:', {
    isValid,
    errors,
    correctedParams,
    originalParams
  });
  
  return { isValid, errors, correctedParams };
}







// Export old function for backward compatibility
export async function searchFlightsWithGemini(query: string): Promise<SearchResult> {
  const isFlightSearch = await determineIfFlightSearch(query);

  if (isFlightSearch) {
    return searchFlightsWithQuery(query);
  }

  // If this is not a flight search, return general response from Gemini
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5',
        messages: [{ role: 'user', content: query }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(errorData.error?.message || 'Error getting response from API');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Sorry, unable to get response.';
    return { type: 'text', data: content };
  } catch (error) {
    console.error('Error with Gemini:', error);
    return { type: 'text', data: 'An error occurred while accessing Gemini.' };
  }
}

async function determineIfFlightSearch(query: string): Promise<boolean> {
  const prompt = `Is this a request to search for flight tickets? Answer only "yes" or "no". Request: "${query}"`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 3,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content.trim().toLowerCase();
    return answer === 'yes';
  } catch (error) {
    console.error('Error determining flight search type:', error);
    return false;
  }
}

async function searchFlightsWithQuery(query: string): Promise<SearchResult> {
  try {
    // Try to extract search parameters from text query
    const searchParams = extractSearchParamsFromQuery(query);
    
    if (searchParams) {
      return await searchFlightsWithSerpAPI(searchParams);
    }
    
    // If unable to extract parameters, return general result
    const flights: Flight[] = [{
      airline: 'Multiple Airlines',
      flightNumber: 'Various',
      departure: {
        airport: 'Various',
        city: 'Various',
        time: 'Various',
        date: new Date().toISOString().split('T')[0]
      },
      arrival: {
        airport: 'Various',
        city: 'Various',
        time: 'Various',
        date: new Date().toISOString().split('T')[0]
      },
      duration: 'Various',
      price: 'Check for prices',
      stops: 0,
      aircraft: 'Various',
      cabinClass: 'Economy',
      baggage: 'Standard',
      refundable: false
    }];
    
    return { 
      type: 'flights', 
      data: flights,
      warning: 'General results are shown. For accurate search, specify departure and arrival cities, as well as date.'
    };
    
  } catch (error) {
    console.error('Query-based flight search error:', error);
    return { 
      type: 'text', 
      data: 'Unable to perform flight search for your request. Please try to clarify search parameters.' 
    };
  }
}

function extractSearchParamsFromQuery(query: string): SearchParams | null {
  // Simple logic to extract parameters from text query
  const fromMatch = query.match(/(?:from|из)\s+([a-zA-Zа-яА-Я\s]+?)(?:\s+to|\s+в|\s+на)/i);
  const toMatch = query.match(/(?:to|в|на)\s+([a-zA-Zа-яА-Я\s]+?)(?:\s+on|\s+на|\s+дата)/i);
  const dateMatch = query.match(/(?:on|на|дата)\s+([a-zA-Zа-яА-Я0-9\s\-\.]+)/i);
  
  // Determine cabin class from query
  let cabinClass: string = 'economy'; // Default economy
  if (query.toLowerCase().includes('business')) {
    cabinClass = 'business';
  } else if (query.toLowerCase().includes('first') || query.toLowerCase().includes('premium')) {
    cabinClass = 'first';
  }

  // Determine if it's a one-way or round-trip search
  const isOneWay = !query.toLowerCase().includes('return') && !query.toLowerCase().includes('round trip');
  
  if (fromMatch && toMatch) {
    return {
      from: fromMatch[1].trim(),
      to: toMatch[1].trim(),
      date: dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0],
      returnDate: null, // Will be set to same date for one-way flights
      passengers: 1,
      cabinClass: cabinClass,
      isOneWay: isOneWay
    };
  }
  
  return null;
}

// Function to test Gemini validation with sample data
export async function testGeminiValidation(): Promise<void> {
  console.log(' Testing Gemini validation...');
  
  const testCases = [
    {
      name: 'Valid response',
      from: 'Moscow',
      to: 'Paris',
      date: '2025-01-15',
      returnDate: '2025-01-20',
      isOneWay: false,
      geminiResponse: {
        from: 'Moscow',
        to: 'Paris',
        fromAirportCode: 'SVO',
        toAirportCode: 'CDG',
        departureDate: '2025-01-15',
        returnDate: '2025-01-20',
        bookingLink: 'https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20SVO%20to%20CDG%20on%202025-01-15%20return%20on%202025-01-20'
      }
    },
    {
      name: 'Invalid airport codes',
      from: 'NYC',
      to: 'LA',
      date: '2025-01-15',
      returnDate: null,
      isOneWay: true,
      geminiResponse: {
        from: 'New York',
        to: 'Los Angeles',
        fromAirportCode: 'NYC', // Invalid - should be JFK
        toAirportCode: 'LA',   // Invalid - should be LAX
        departureDate: '2025-01-15',
        returnDate: '2025-01-15',
        bookingLink: 'https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20NYC%20to%20LA%20on%202025-01-15'
      }
    },
    {
      name: 'Invalid date format',
      from: 'London',
      to: 'Tokyo',
      date: '2025-01-15',
      returnDate: '2025-01-25',
      isOneWay: false,
      geminiResponse: {
        from: 'London',
        to: 'Tokyo',
        fromAirportCode: 'LHR',
        toAirportCode: 'NRT',
        departureDate: '15/01/2025', // Invalid format
        returnDate: '25/01/2025',   // Invalid format
        bookingLink: 'https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20LHR%20to%20NRT%20on%2015/01/2025%20return%20on%2025/01/2025'
      }
    },
    {
      name: 'Duplicate airports',
      from: 'Berlin',
      to: 'Berlin',
      date: '2025-01-15',
      returnDate: null,
      isOneWay: true,
      geminiResponse: {
        from: 'Berlin',
        to: 'Berlin',
        fromAirportCode: 'BER',
        toAirportCode: 'BER', // Same as departure
        departureDate: '2025-01-15',
        returnDate: '2025-01-15',
        bookingLink: 'https://www.google.com/travel/flights?hl=en&f=0&t=0&q=Flights%20from%20BER%20to%20BER%20on%202025-01-15'
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n Testing: ${testCase.name}`);
    console.log('Input:', { from: testCase.from, to: testCase.to, date: testCase.date, returnDate: testCase.returnDate, isOneWay: testCase.isOneWay });
    console.log('Gemini response:', testCase.geminiResponse);
    
    const originalParams = { 
      from: testCase.from, 
      to: testCase.to, 
      date: testCase.date, 
      returnDate: testCase.returnDate, 
      isOneWay: testCase.isOneWay 
    };
    
    const validation = validateGeminiResponse(testCase.geminiResponse, originalParams);
    
    console.log('Validation result:', {
      isValid: validation.isValid,
      errors: validation.errors,
      correctedParams: validation.correctedParams
    });
    
    if (validation.isValid) {
      console.log(' Test passed');
    } else {
      console.log(' Test failed with errors:', validation.errors);
    }
  }
  
  console.log('\n Gemini validation testing completed');
}

// Function to merge multiple SerpAPI responses
function mergeSerpAPIResults(results: Record<string, unknown>[]): Record<string, unknown> {
  if (results.length === 0) {
    return {};
  }
  
  if (results.length === 1) {
    return results[0];
  }
  
  const merged: Record<string, unknown> = { ...results[0] };
  
  // Merge best_flights
  const allBestFlights: unknown[] = [];
  results.forEach(result => {
    if (result.best_flights && Array.isArray(result.best_flights)) {
      allBestFlights.push(...result.best_flights);
    }
  });
  
  if (allBestFlights.length > 0) {
    merged.best_flights = allBestFlights;
  }
  
  // Merge other_flights
  const allOtherFlights: unknown[] = [];
  results.forEach(result => {
    if (result.other_flights && Array.isArray(result.other_flights)) {
      allOtherFlights.push(...result.other_flights);
    }
  });
  
  if (allOtherFlights.length > 0) {
    merged.other_flights = allOtherFlights;
  }
  
  // Merge search metadata
  if (results.some(r => r.search_metadata)) {
    merged.search_metadata = {
      total_results: allBestFlights.length + allOtherFlights.length,
      id: `merged-${Date.now()}`,
      status: 'merged'
    };
  }
  
  console.log(' Merged results:', {
    totalBestFlights: allBestFlights.length,
    totalOtherFlights: allOtherFlights.length,
    totalFlights: allBestFlights.length + allOtherFlights.length
  });
  
     return merged;
 }

 // Function to remove duplicate flights based on unique identifiers
 function removeDuplicateFlights(flights: Flight[]): Flight[] {
   const uniqueFlights = new Map<string, Flight>();
   
   flights.forEach(flight => {
     // Create a unique key based on flight details
     const uniqueKey = `${flight.airline}-${flight.flightNumber}-${flight.departure.airport}-${flight.arrival.airport}-${flight.departure.time}-${flight.arrival.time}-${flight.price}`;
     
     if (!uniqueFlights.has(uniqueKey)) {
       uniqueFlights.set(uniqueKey, flight);
     }
   });
   
   return Array.from(uniqueFlights.values());
}

// Function to search flights using SerpAPI, optionally with Gemini improvements
export async function searchFlights(
  from: string,
  to: string,
  date: string,
  returnDate: string | null,
  isOneWay: boolean,
  cabinClass: string,
  passengers: number
): Promise<SearchResult> {
  // Use Gemini to improve and normalize search parameters
  console.log(' Improving search parameters with Gemini...');
  const improvedParams = await improveSearchParamsWithGemini(from, to, date, returnDate ?? null, isOneWay);
  
  console.log(' Improved params with Gemini:', improvedParams);
  
  // Log validation warnings if any
  if (improvedParams.validationWarnings && improvedParams.validationWarnings.length > 0) {
    console.warn(' Gemini validation warnings:', improvedParams.validationWarnings);
  }
  
  if (improvedParams.error) {
    console.warn(' Gemini processing error:', improvedParams.error);
  }
  
  // Use improved parameters
  const normalizedFrom = improvedParams.from;
  const normalizedTo = improvedParams.to;
  const normalizedDate = improvedParams.departureDate;
  const normalizedReturnDate = improvedParams.returnDate || null;
  
  // Use airport codes from Gemini
  const departureAirport = improvedParams.fromAirportCode;
  const arrivalAirport = improvedParams.toAirportCode;
  
  if (!departureAirport || !arrivalAirport) {
    return {
      type: 'text',
      data: `Unable to find airport codes for ${normalizedFrom} or ${normalizedTo}. Please use major city names or airport codes.`
    };
  }

  // Format date to YYYY-MM-DD using improved dates
  let dateObj = new Date(normalizedDate);
  
  // Check if date is in the past, if so use tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (dateObj < today) {
    console.log(' Date is in the past, using tomorrow instead');
    dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 1);
  }
  
  const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  
  // Format return date - Google Flights API always requires return_date
  // For one-way flights, return_date should be the same as departure_date (user's date)
  let returnDateToUse: string;
  if (isOneWay) {
    // For one-way flights, use the same date as departure (user's date)
    returnDateToUse = normalizedDate;
  } else {
    // For round-trip flights, use the actual return date
    returnDateToUse = normalizedReturnDate || normalizedDate;
  }
  
  let returnDateObj = new Date(returnDateToUse);
  
  // Check if return date is in the past, if so use departure date (same date for one-way)
  if (returnDateObj < today) {
    console.log(' Return date is in the past, using departure date instead');
    returnDateObj = new Date(dateObj);
    returnDateToUse = returnDateObj.toISOString().split('T')[0];
  }
  
  // For one-way flights, ensure return date equals departure date
  if (isOneWay && returnDateObj.getTime() !== dateObj.getTime()) {
    console.log(' One-way flight: adjusting return date to match departure date');
    returnDateObj = new Date(dateObj);
    returnDateToUse = returnDateObj.toISOString().split('T')[0];
  }
  
  // For round-trip flights, ensure return date is not before departure date
  if (!isOneWay && returnDateObj < dateObj) {
    console.log(' Round-trip: return date is before departure date, adjusting return date');
    returnDateObj.setDate(dateObj.getDate() + 1);
    returnDateToUse = returnDateObj.toISOString().split('T')[0];
  }
  
  const formattedReturnDate = `${returnDateObj.getFullYear()}-${String(returnDateObj.getMonth() + 1).padStart(2, '0')}-${String(returnDateObj.getDate()).padStart(2, '0')}`;

  // Build Google Flights API URL with correct parameters
  // Google Flights API always requires return_date parameter
  const searchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departureAirport}&arrival_id=${arrivalAirport}&outbound_date=${formattedDate}&return_date=${formattedReturnDate}&adults=${passengers}&currency=USD&hl=en&api_key=${SERPAPI_KEY}`;
  
  console.log(' SerpAPI google_flights URL:', searchUrl);
  console.log(` Flight type: ${isOneWay ? 'One-way' : 'Round-trip'}`);
  console.log(` Departure: ${formattedDate}, Return: ${formattedReturnDate}`);
  console.log(` Gemini improved cities: ${normalizedFrom} → ${normalizedTo}`);
  console.log(` Gemini improved dates: ${normalizedDate} → ${normalizedReturnDate || 'one-way'}`);
  console.log(` Date validation: departure=${dateObj.toISOString()}, return=${returnDateObj.toISOString()}`);
  console.log(` Is return date in past: ${returnDateObj < today}`);
  console.log(` Is return before departure: ${returnDateObj < dateObj}`);
  console.log(` IMPORTANT: Only searching for outbound route: ${departureAirport} → ${arrivalAirport}`);
  
  const response = await fetch(searchUrl);
  
  if (!response.ok) {
    console.log(` SerpAPI google_flights error: ${response.status} - ${response.statusText}`);
    return { 
      type: 'text', 
      data: 'Unable to search for flights at the moment. Please try again later.' 
    };
  }
  
  const data = await response.json();
  console.log(' SerpAPI google_flights response received');
  console.log(' Full response structure:', Object.keys(data));
  
  // Process Google Flights results - check both best_flights and other_flights
  let allFlights: Flight[] = [];
  
  // Log detailed structure of flight data
  if (data.best_flights) {
    console.log(' best_flights structure:', typeof data.best_flights, Array.isArray(data.best_flights) ? data.best_flights.length : 'not array');
    console.log(' best_flights sample:', JSON.stringify(data.best_flights, null, 2).substring(0, 1000));
    
    // Log first flight item structure
    if (Array.isArray(data.best_flights) && data.best_flights.length > 0) {
      const firstFlight = data.best_flights[0];
      console.log(' First best_flight item keys:', Object.keys(firstFlight));
      console.log(' First best_flight item structure:', JSON.stringify(firstFlight, null, 2).substring(0, 800));
    }
  }
  
  if (data.other_flights) {
    console.log(' other_flights structure:', typeof data.other_flights, Array.isArray(data.other_flights) ? data.other_flights.length : 'not array');
    console.log(' other_flights sample:', JSON.stringify(data.other_flights, null, 2).substring(0, 1000));
    
    // Log first flight item structure
    if (Array.isArray(data.other_flights) && data.other_flights.length > 0) {
      const firstFlight = data.other_flights[0];
      console.log(' First other_flight item keys:', Object.keys(firstFlight));
      console.log(' First other_flight item structure:', JSON.stringify(firstFlight, null, 2).substring(0, 800));
    }
  }
  
  // Check best_flights
  if (data.best_flights && Array.isArray(data.best_flights) && data.best_flights.length > 0) {
    console.log(` Found ${data.best_flights.length} best flights`);
    const bestFlights = data.best_flights.map((flightData: Record<string, unknown>) => 
      createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams)
    ).filter(Boolean);
    
    // Validate outbound flights to ensure they match the requested route
    const validatedBestFlights = bestFlights.filter((flight: Flight) => {
      const isCorrectRoute = flight.departure.airport === departureAirport && flight.arrival.airport === arrivalAirport;
      if (!isCorrectRoute) {
        console.warn(` Filtered out incorrect outbound flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${departureAirport} → ${arrivalAirport})`);
      }
      return isCorrectRoute;
    });
    
    console.log(` Processed ${validatedBestFlights.length} valid best flights (filtered from ${bestFlights.length})`);
    allFlights.push(...validatedBestFlights);
  }
  
  // Check other_flights
  if (data.other_flights && Array.isArray(data.other_flights) && data.other_flights.length > 0) {
    console.log(` Found ${data.other_flights.length} other flights`);
    const otherFlights = data.other_flights.map((flightData: Record<string, unknown>) => 
      createFlightFromSerpAPIFlights(flightData, cabinClass, 'outbound', improvedParams)
    ).filter(Boolean);
    
    // Validate other outbound flights to ensure they match the requested route
    const validatedOtherFlights = otherFlights.filter((flight: Flight) => {
      const isCorrectRoute = flight.departure.airport === departureAirport && flight.arrival.airport === arrivalAirport;
      if (!isCorrectRoute) {
        console.warn(` Filtered out incorrect outbound flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${departureAirport} → ${arrivalAirport})`);
      }
      return isCorrectRoute;
    });
    
    console.log(` Processed ${validatedOtherFlights.length} valid other flights (filtered from ${otherFlights.length})`);
    allFlights.push(...validatedOtherFlights);
  }
  
  // For round-trip flights, also search for return flights
  if (!isOneWay && normalizedReturnDate && normalizedReturnDate.trim() !== '') {
    console.log(' Searching for return flights...');
    console.log(' Round-trip search detected:', { isOneWay, returnDate: normalizedReturnDate, formattedReturnDate });
    
    // Search for return flights (reverse direction)
    // For return flights, we need to use the return date as the main departure date
    // and set a future return date (since we're looking for flights FROM destination TO origin)
    const returnOutboundDate = formattedReturnDate; // This is when we want to leave the destination
    const returnReturnDate = new Date(formattedReturnDate);
    returnReturnDate.setDate(returnReturnDate.getDate() + 1); // Add 1 day for the return
    const formattedReturnReturnDate = `${returnReturnDate.getFullYear()}-${String(returnReturnDate.getMonth() + 1).padStart(2, '0')}-${String(returnReturnDate.getDate()).padStart(2, '0')}`;
    
    const returnSearchUrl = `https://serpapi.com/search.json?engine=google_flights&departure_id=${arrivalAirport}&arrival_id=${departureAirport}&outbound_date=${returnOutboundDate}&return_date=${formattedReturnReturnDate}&adults=${passengers}&currency=USD&hl=en&api_key=${SERPAPI_KEY}`;
    
    console.log(' Return flights search details:', {
      departure: arrivalAirport, // From destination
      arrival: departureAirport, // To origin
      outboundDate: returnOutboundDate, // When we leave destination
      returnDate: formattedReturnReturnDate // Next day (required by API)
    });
    console.log(' Return flights search URL:', returnSearchUrl);
    
    try {
      const returnResponse = await fetch(returnSearchUrl);
      console.log(' Return flights response status:', returnResponse.status, returnResponse.statusText);
      
      if (returnResponse.ok) {
        const returnData = await returnResponse.json();
        console.log(' Return flights response received');
        console.log(' Return flights response keys:', Object.keys(returnData));
        
        // Process return flights - ONLY from destination to origin
        if (returnData.best_flights && Array.isArray(returnData.best_flights) && returnData.best_flights.length > 0) {
          console.log(` Found ${returnData.best_flights.length} return best flights`);
          const returnFlights = returnData.best_flights.map((flightData: Record<string, unknown>) => 
            createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams)
          ).filter(Boolean);
          
          // Additional validation: ensure flights are actually on the return route
          const validatedReturnFlights = returnFlights.filter((flight: Flight) => {
            const isCorrectRoute = flight.departure.airport === arrivalAirport && flight.arrival.airport === departureAirport;
            if (!isCorrectRoute) {
              console.warn(` Filtered out incorrect return flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${arrivalAirport} → ${departureAirport})`);
            }
            return isCorrectRoute;
          });
          
          console.log(` Processed ${validatedReturnFlights.length} valid return flights (filtered from ${returnFlights.length})`);
          allFlights.push(...validatedReturnFlights);
        } else {
          console.log(' No return best_flights found in response');
          if (returnData.error) {
            console.log(' Return flights error:', returnData.error);
          }
        }
        
        if (returnData.other_flights && Array.isArray(returnData.other_flights) && returnData.other_flights.length > 0) {
          console.log(` Found ${returnData.other_flights.length} return other flights`);
          const returnFlights = returnData.other_flights.map((flightData: Record<string, unknown>) => 
            createFlightFromSerpAPIFlights(flightData, cabinClass, 'return', improvedParams)
          ).filter(Boolean);
          
          // Additional validation: ensure flights are actually on the return route
          const validatedReturnFlights = returnFlights.filter((flight: Flight) => {
            const isCorrectRoute = flight.departure.airport === arrivalAirport && flight.arrival.airport === departureAirport;
            if (!isCorrectRoute) {
              console.warn(` Filtered out incorrect return flight: ${flight.departure.airport} → ${flight.arrival.airport} (expected: ${arrivalAirport} → ${departureAirport})`);
            }
            return isCorrectRoute;
          });
          
          console.log(` Processed ${validatedReturnFlights.length} valid return flights (filtered from ${returnFlights.length})`);
          allFlights.push(...validatedReturnFlights);
        } else {
          console.log(' No return other_flights found in response');
          if (returnData.error) {
            console.log(' Return flights error:', returnData.error);
          }
        }
        
        // Log total return flights found
        const totalReturnFlights = allFlights.filter(f => f.tripType === 'return').length;
        console.log(` Total return flights added: ${totalReturnFlights}`);
      } else {
        console.error(' Return flights response not ok:', returnResponse.status, returnResponse.statusText);
        // Try to get error details from response
        try {
          const errorData = await returnResponse.text();
          console.error(' Return flights error response:', errorData);
        } catch (e) {
          console.error(' Could not read error response');
        }
      }
    } catch (returnError) {
      console.error(' Error searching return flights:', returnError);
      console.error(' Return error details:', {
        message: returnError instanceof Error ? returnError.message : 'Unknown error',
        stack: returnError instanceof Error ? returnError.stack : 'No stack trace'
      });
      // Continue with outbound flights only
    }
  } else {
    console.log(' Skipping return flights search:', {
      isOneWay, 
      returnDate, 
      hasReturnDate: !!returnDate,
      returnDateLength: returnDate ? returnDate.length : 0 
    });
  }
  
  if (allFlights.length > 0) {
    console.log(` Total flights found: ${allFlights.length}`);
    
    try {
      // Log comprehensive search summary
      logFlightSearchSummary(
        { from, to, date, returnDate: returnDate ?? null, passengers, cabinClass, isOneWay },
        improvedParams,
        allFlights,
        improvedParams.validationWarnings
      );
    } catch (loggingError) {
      console.warn(' Error in detailed logging, continuing with basic info:', loggingError);
      console.log(` Search completed: ${allFlights.length} flights found`);
    }
    
    return {
      type: 'flights',
      data: allFlights
    };
  }
  
  console.log(' No flights found in best_flights or other_flights');
  return {
    type: 'text',
    data: 'No flights found for the specified route and date.'
  };
}

// Helper function to create specific flight links
function createSpecificFlightLink(
  departureAirport: string,
  arrivalAirport: string,
  departureDate: string,
  arrivalDate: string,
  airline: string,
  flightNumber: string,
  cabinClass: string,
  tripType: 'outbound' | 'return'
): string {
  // Try to create direct links to airline websites or better search results
  
  // For major airlines, try to create direct links
  const airlineLower = airline.toLowerCase();
  
  if (airlineLower.includes('delta')) {
    // Delta Airlines direct search
    return `https://www.delta.com/flight-search?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}&cabin=${cabinClass}`;
  }
  
  if (airlineLower.includes('american') || airlineLower.includes('aa')) {
    // American Airlines direct search
    return `https://www.aa.com/flights?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}&cabin=${cabinClass}`;
  }
  
  if (airlineLower.includes('united') || airlineLower.includes('ua')) {
    // United Airlines direct search
    return `https://www.united.com/en/us/flight-search?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}&cabin=${cabinClass}`;
  }
  
  if (airlineLower.includes('southwest') || airlineLower.includes('wn')) {
    // Southwest Airlines direct search
    return `https://www.southwest.com/flight/?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}`;
  }
  
  if (airlineLower.includes('jetblue') || airlineLower.includes('b6')) {
    // JetBlue direct search
    return `https://www.jetblue.com/flights?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}`;
  }
  
  if (airlineLower.includes('alaska') || airlineLower.includes('as')) {
    // Alaska Airlines direct search
    return `https://www.alaskaair.com/flights?from=${departureAirport}&to=${arrivalAirport}&date=${departureDate}`;
  }
  
  // For other airlines, use Kayak with specific flight search
  const kayakQuery = encodeURIComponent(`${departureAirport} to ${arrivalAirport} ${departureDate} ${airline} ${flightNumber}`);
  return `https://www.kayak.com/flights/${departureAirport}-${arrivalAirport}/${departureDate}?airlines=${airline}&sort=price_a`;
  
  // Alternative: Use Skyscanner with specific parameters
  // return `https://www.skyscanner.com/transport/flights/${departureAirport}/${arrivalAirport}/${departureDate}/?airlines=${airline}`;
}

