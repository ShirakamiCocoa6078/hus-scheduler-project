
import { NextResponse, type NextRequest } from 'next/server';

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

interface TransitRoute {
  totalDuration: number; // in minutes
  estimatedArrivalTime: string; // ISO string
  steps: TransitStep[];
}

export async function POST(request: NextRequest) {
  const { origin, departureTime: departureTimeInput } = await request.json();
  const apiKey = process.env.Maps_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'Google Maps API key is not configured.' }, { status: 500 });
  }
  if (!origin) {
    return NextResponse.json({ message: 'Origin address is required.' }, { status: 400 });
  }

  const departureTime = (departureTimeInput === 'now' || !departureTimeInput)
    ? 'now'
    : Math.floor(new Date(departureTimeInput).getTime() / 1000).toString();

  const destination = "홋카이도과학대학 버스 정류장";
  const params = new URLSearchParams({
    origin: origin,
    destination: destination,
    mode: 'transit',
    departure_time: departureTime,
    language: 'ja',
    region: 'jp',
    transit_mode: 'bus|train|subway',
    key: apiKey,
  });

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
      }, { status: apiResponse.status });
    }
    
    const route = rawData.routes[0];
    if (!route) {
         return NextResponse.json({ 
            message: "No route found.",
            rawResponse: rawData 
        }, { status: 404 });
    }

    const leg = route.legs[0];
    const formattedRoute: TransitRoute = {
      totalDuration: Math.round(leg.duration.value / 60),
      estimatedArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
      steps: leg.steps.map((step: any): TransitStep => {
        const baseStep: Partial<TransitStep> = {
          travelMode: step.travel_mode,
          instructions: step.html_instructions.replace(/<[^>]*>?/gm, ''),
          duration: Math.round(step.duration.value / 60),
          distance: step.distance.text,
        };

        if (step.travel_mode === "TRANSIT") {
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
      }),
    };

    return NextResponse.json({ formattedRoute, rawResponse: rawData });

  } catch (error) {
    console.error('Error calling Google Maps API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
