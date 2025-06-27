
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
  const { origin, departureTime, arrivalTime } = await request.json();
  const apiKey = process.env.Maps_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'Google Maps API key is not configured.' }, { status: 500 });
  }
  if (!origin) {
    return NextResponse.json({ message: 'Origin address is required.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    origin: origin,
    destination: "홋카이도과학대학 버스 정류장",
    mode: 'transit',
    language: 'ja',
    region: 'jp',
    key: apiKey,
  });

  // Decide whether to use arrival_time or departure_time
  if (arrivalTime) {
    // 'Arrive By' logic
    const arrivalTimestamp = Math.floor(new Date(arrivalTime).getTime() / 1000);
    params.set('arrival_time', arrivalTimestamp.toString());
  } else {
    // 'Depart At' logic (the original functionality)
    const departureTimestamp = (departureTime === 'now' || !departureTime)
      ? 'now'
      : Math.floor(new Date(departureTime).getTime() / 1000).toString();
    params.set('departure_time', departureTimestamp);
  }

  const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

  try {
    const apiResponse = await fetch(apiUrl);
    const rawData = await apiResponse.json();

    if (!apiResponse.ok || rawData.status !== "OK") {
      console.error("Google Maps API Error:", rawData);
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

    if (arrivalTime) {
        // 'Arrive By' logic: Find the route with the latest departure time
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
        // 'Depart At' logic: Use the first route provided
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
    console.error('Error calling Google Maps API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
