
import { NextResponse, type NextRequest } from 'next/server';

// Common interface for a single step in a journey
interface TransitStep {
  travelMode: "WALKING" | "TRANSIT";
  instructions: string;
  duration: number; // in minutes
  distance: string;
  transitDetails?: {
    lineName: string;
    vehicleType: "BUS" | "SUBWAY" | "TRAIN" | "TRAM" | "HEAVY_RAIL" | "COMMUTER_TRAIN";
    departureStop: string;
    arrivalStop: string;
    departureTime: string; // ISO string
    arrivalTime: string; // ISO string
    numStops: number;
  };
}

// Common function to format a raw step from Google's API
function formatStep(step: any): TransitStep {
    const baseStep: Partial<TransitStep> = {
        travelMode: step.travel_mode,
        instructions: step.html_instructions.replace(/<[^>]*>?/gm, ''),
        duration: Math.round(step.duration.value / 60),
        distance: step.distance.text,
    };

    if (step.travel_mode === "TRANSIT" && step.transit_details) {
        const transitDetails = step.transit_details;
        baseStep.transitDetails = {
            lineName: transitDetails.line.name,
            vehicleType: transitDetails.line.vehicle.type,
            departureStop: transitDetails.departure_stop.name,
            arrivalStop: transitDetails.arrival_stop.name,
            departureTime: new Date(transitDetails.departure_time.value * 1000).toISOString(),
            arrivalTime: new Date(transitDetails.arrival_time.value * 1000).toISOString(),
            numStops: transitDetails.num_stops,
        };
    }
    return baseStep as TransitStep;
}


export async function POST(request: NextRequest) {
  console.log('[DEBUG] /api/dev/transit-route POST handler started.');

  let body;
  try {
    body = await request.json();
    console.log('[DEBUG] Received request body:', body);
  } catch (e) {
    console.error('[DEBUG] Failed to parse request body as JSON:', e);
    return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
  }
  
  const { origin, destination, departureTime, arrivalTime } = body;
  const apiKey = process.env.Maps_API_KEY;

  if (!apiKey) {
    console.error('[DEBUG] Google Maps API key is not configured.');
    return NextResponse.json({ message: 'Google Maps API key is not configured.' }, { status: 500 });
  }

  const isToSchool = !!arrivalTime;
  const universityLocation = "홋카이도과학대학 버스 정류장";

  const params = new URLSearchParams({
    mode: 'transit',
    language: 'ko',
    region: 'jp',
    key: apiKey,
  });

  if (isToSchool) {
    if (!origin) {
      return NextResponse.json({ message: 'Origin address is required.' }, { status: 400 });
    }
    params.set('origin', origin);
    params.set('destination', universityLocation);
    
    console.log('[DEBUG] Original arrivalTime string:', arrivalTime);
    const arrivalDate = new Date(arrivalTime);

    if (isNaN(arrivalDate.getTime())) {
        console.error('[DEBUG] Invalid arrivalTime received:', arrivalTime);
        return NextResponse.json({ message: 'Invalid arrivalTime format. Please provide an ISO 8601 string.' }, { status: 400 });
    }

    console.log('[DEBUG] Parsed arrivalTime Date object:', arrivalDate.toISOString());
    const arrivalTimestamp = Math.floor(arrivalDate.getTime() / 1000);
    console.log('[DEBUG] Converted arrival_time timestamp:', arrivalTimestamp);
    
    params.set('arrival_time', arrivalTimestamp.toString());
  } else {
    if (!destination) {
      return NextResponse.json({ message: 'Destination address is required.' }, { status: 400 });
    }
    params.set('origin', universityLocation);
    params.set('destination', destination);
    
    if (departureTime && departureTime !== 'now') {
      console.log('[DEBUG] Original departureTime string:', departureTime);
      const departureDate = new Date(departureTime);

      if (isNaN(departureDate.getTime())) {
        console.error('[DEBUG] Invalid departureTime received:', departureTime);
        return NextResponse.json({ message: 'Invalid departureTime format. Please provide an ISO 8601 string.' }, { status: 400 });
      }

      console.log('[DEBUG] Parsed departureTime Date object:', departureDate.toISOString());
      const departureTimestamp = Math.floor(departureDate.getTime() / 1000).toString();
      console.log('[DEBUG] Converted departure_time timestamp:', departureTimestamp);
      params.set('departure_time', departureTimestamp);
    } else {
      console.log('[DEBUG] Using "now" for departure_time.');
    }
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
  console.log('[DEBUG] Final Google Maps API URL:', apiUrl);

  try {
    const apiResponse = await fetch(apiUrl);
    const rawData = await apiResponse.json();
    console.log('[DEBUG] Raw Google Maps API Response:', JSON.stringify(rawData, null, 2));

    if (!apiResponse.ok || rawData.status !== "OK") {
      const errorMessage = rawData.error_message || `API returned status: ${rawData.status}`;
      return NextResponse.json({ 
        message: `Failed to fetch transit route. ${errorMessage}`,
        rawResponse: rawData 
      }, { status: apiResponse.status || 500 });
    }
    
    if (rawData.routes.length === 0) {
        return NextResponse.json({ 
            message: "No route found for the specified criteria.",
            rawResponse: rawData 
        }, { status: 404 });
    }

    if (isToSchool) {
        let bestRoute = null;
        let latestDepartureTimestamp = 0;

        for (const route of rawData.routes) {
            const currentDepartureTimestamp = route.legs[0].departure_time.value;
            if (currentDepartureTimestamp > latestDepartureTimestamp) {
                latestDepartureTimestamp = currentDepartureTimestamp;
                bestRoute = route;
            }
        }
        
        if (!bestRoute) {
             return NextResponse.json({ message: "Could not determine the best route.", rawResponse: rawData }, { status: 404 });
        }
        
        const leg = bestRoute.legs[0];
        const formattedResult = {
            latestDepartureTime: new Date(leg.departure_time.value * 1000).toISOString(),
            finalArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
            totalDuration: Math.round(leg.duration.value / 60),
            steps: leg.steps.map(formatStep)
        };
        return NextResponse.json({ formattedRoute: formattedResult, rawResponse: rawData });

    } else {
        const route = rawData.routes[0];
        const leg = route.legs[0];
        const formattedResult = {
          totalDuration: Math.round(leg.duration.value / 60),
          estimatedArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
          steps: leg.steps.map(formatStep),
        };
        return NextResponse.json({ formattedRoute: formattedResult, rawResponse: rawData });
    }

  } catch (error) {
    console.error('[DEBUG] Error calling Google Maps API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
