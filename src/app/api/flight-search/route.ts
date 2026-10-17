import { NextResponse } from 'next/server';
import { searchFlightsByParams } from '@/lib/flight-search';

export async function POST(request: Request) {
  try {
    const { from, to, date, returnDate, passengers, cabinClass, isOneWay, selectedFromAirports, selectedToAirports } = await request.json();
    
    console.log(' Flight search API called with:', {
      from, to, date, returnDate, passengers, cabinClass, isOneWay,
      hasReturnDate: !!returnDate,
      returnDateType: typeof returnDate,
      returnDateLength: returnDate ? returnDate.length : 0
    });
    
    // Log cabin class details
    console.log(' Cabin class details:', {
      cabinClass,
      type: typeof cabinClass,
      isArray: Array.isArray(cabinClass),
      length: Array.isArray(cabinClass) ? cabinClass.length : 1,
      value: cabinClass
    });
    
    if (!from || !to || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // For round-trip flights, return date is required
    if (!isOneWay && !returnDate) {
      console.log(' Validation failed: return date required for round-trip');
      return NextResponse.json({ error: 'Return date is required for round-trip flights' }, { status: 400 });
    }

    // For one-way flights, we'll use the same date as return date
    const finalReturnDate = isOneWay ? date : returnDate;
    
    console.log(' Processed params:', {
      from, to, date, 
      returnDate: finalReturnDate, 
      passengers: passengers || 1, 
      cabinClass: cabinClass || 'economy', 
      isOneWay
    });

    const result = await searchFlightsByParams({ 
      from, 
      to, 
      date, 
      returnDate: finalReturnDate, 
      passengers: passengers || 1, 
      cabinClass: cabinClass || 'economy', 
      isOneWay,
      selectedFromAirports,
      selectedToAirports
    });
    
    // Log the result type for debugging
    if (result.type === 'flights') {
      console.log(' Flight search successful, found', result.data.length, 'flights');
    } else {
      console.log(' Flight search failed:', result.data);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Flight search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
