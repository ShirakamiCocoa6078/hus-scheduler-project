
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

// Helper function to get Place ID from an address
async function getPlaceId(address: string, apiKey: string, logs: string[]): Promise<string | null> {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=ko`;
  logs.push(`[DEBUG] Geocoding URL for "${address}": ${geocodeUrl}`);
  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    logs.push(`[DEBUG] Geocoding response for "${address}": ${JSON.stringify(data, null, 2)}`);
    if (data.status === 'OK' && data.results[0]?.place_id) {
      const placeId = data.results[0].place_id;
      logs.push(`[DEBUG] Found Place ID for "${address}": ${placeId}`);
      return placeId;
    } else {
      logs.push(`[DEBUG] Could not find Place ID for "${address}". Status: ${data.status}`);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown geocoding error';
    logs.push(`[DEBUG] Error fetching Place ID for "${address}": ${errorMessage}`);
    console.error(`[DEBUG] Geocoding API error for "${address}":`, error);
    return null;
  }
}


export async function POST(request: NextRequest) {
  const debugLogs: string[] = [];
  debugLogs.push('[DEBUG] /api/dev/transit-route POST handler started (v3 with Place ID).');

  let body;
  try {
    body = await request.json();
    debugLogs.push(`[DEBUG] Received request body: ${JSON.stringify(body)}`);
  } catch (e) {
    const errorMsg = '[DEBUG] Failed to parse request body as JSON.';
    debugLogs.push(errorMsg);
    console.error(errorMsg, e);
    return NextResponse.json({ message: 'Invalid JSON in request body.', debugLogs }, { status: 400 });
  }
  
  const { origin, destination, departureTime, arrivalTime } = body;
  const apiKey = process.env.Maps_API_KEY;

  if (!apiKey) {
    const errorMsg = '[DEBUG] Google Maps API key is not configured.';
    debugLogs.push(errorMsg);
    console.error(errorMsg);
    return NextResponse.json({ message: 'Google Maps API key is not configured.', debugLogs }, { status: 500 });
  }

  const universityAddress = "北海道札幌市手稲区前田７条１５丁目４−１";
  const isToSchool = !!arrivalTime;

  try {
    let originForApi: string;
    let destinationForApi: string;

    if (isToSchool) {
        if (!origin) {
            const errorMsg = 'Origin address is required for "to school" route.';
            debugLogs.push(`[DEBUG] Validation failed: ${errorMsg}`);
            return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
        }
        debugLogs.push(`[DEBUG] Mode: To School. Getting Place IDs for Origin ("${origin}") and University ("${universityAddress}").`);
        const [originPlaceId, uniPlaceId] = await Promise.all([
            getPlaceId(origin, apiKey, debugLogs),
            getPlaceId(universityAddress, apiKey, debugLogs)
        ]);

        if (!originPlaceId || !uniPlaceId) {
            const errorMsg = 'Could not find Place ID for origin or university. Check addresses.';
            debugLogs.push(`[DEBUG] ${errorMsg}`);
            return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
        }
        originForApi = `place_id:${originPlaceId}`;
        destinationForApi = `place_id:${uniPlaceId}`;
    } else { // From School
        if (!destination) {
            const errorMsg = 'Destination address is required for "from school" route.';
            debugLogs.push(`[DEBUG] Validation failed: ${errorMsg}`);
            return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
        }
        debugLogs.push(`[DEBUG] Mode: From School. Getting Place IDs for University ("${universityAddress}") and Destination ("${destination}").`);
        const [uniPlaceId, destPlaceId] = await Promise.all([
            getPlaceId(universityAddress, apiKey, debugLogs),
            getPlaceId(destination, apiKey, debugLogs)
        ]);
        
        if (!uniPlaceId || !destPlaceId) {
            const errorMsg = 'Could not find Place ID for university or destination. Check addresses.';
            debugLogs.push(`[DEBUG] ${errorMsg}`);
            return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
        }
        originForApi = `place_id:${uniPlaceId}`;
        destinationForApi = `place_id:${destPlaceId}`;
    }

    const params = new URLSearchParams({
        origin: originForApi,
        destination: destinationForApi,
        mode: 'transit',
        language: 'ko',
        region: 'jp',
        key: apiKey,
    });

    if (isToSchool) {
        debugLogs.push(`[DEBUG] Original arrivalTime string: ${arrivalTime}`);
        const arrivalDate = new Date(arrivalTime);

        if (isNaN(arrivalDate.getTime())) {
            const errorMsg = 'Invalid arrivalTime format. Please provide an ISO 8601 string.';
            debugLogs.push(`[DEBUG] Invalid arrivalTime received: ${arrivalTime}`);
            return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
        }

        debugLogs.push(`[DEBUG] Parsed arrivalTime Date object: ${arrivalDate.toISOString()}`);
        const arrivalTimestamp = Math.floor(arrivalDate.getTime() / 1000);
        debugLogs.push(`[DEBUG] Converted arrival_time timestamp: ${arrivalTimestamp}`);
        params.set('arrival_time', arrivalTimestamp.toString());
    } else { // From School
        if (departureTime && departureTime !== 'now') {
            debugLogs.push(`[DEBUG] Original departureTime string: ${departureTime}`);
            const departureDate = new Date(departureTime);

            if (isNaN(departureDate.getTime())) {
                const errorMsg = 'Invalid departureTime format. Please provide an ISO 8601 string.';
                debugLogs.push(`[DEBUG] Invalid departureTime received: ${departureTime}`);
                return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
            }

            debugLogs.push(`[DEBUG] Parsed departureTime Date object: ${departureDate.toISOString()}`);
            const departureTimestamp = Math.floor(departureDate.getTime() / 1000).toString();
            debugLogs.push(`[DEBUG] Converted departure_time timestamp: ${departureTimestamp}`);
            params.set('departure_time', departureTimestamp);
        } else {
            debugLogs.push('[DEBUG] Using "now" for departure_time.');
            params.set('departure_time', Math.floor(Date.now() / 1000).toString());
        }
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    debugLogs.push(`[DEBUG] Final Google Maps API URL: ${apiUrl}`);

    const apiResponse = await fetch(apiUrl);
    const rawData = await apiResponse.json();
    debugLogs.push(`[DEBUG] Raw Google Maps API Response: ${JSON.stringify(rawData, null, 2)}`);

    if (!apiResponse.ok || rawData.status !== "OK") {
        const errorMessage = rawData.error_message || `API returned status: ${rawData.status}`;
        const finalErrorMessage = `Failed to fetch transit route. ${errorMessage}`;
        debugLogs.push(`[DEBUG] API Error: ${finalErrorMessage}`);
        return NextResponse.json({ 
            message: finalErrorMessage,
            rawResponse: rawData,
            debugLogs
        }, { status: apiResponse.status || 500 });
    }
    
    if (rawData.routes.length === 0) {
        const message = "No route found for the specified criteria.";
        debugLogs.push(`[DEBUG] ${message}`);
        return NextResponse.json({ 
            message: message,
            rawResponse: rawData,
            debugLogs
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
            const message = "Could not determine the best route.";
            debugLogs.push(`[DEBUG] ${message}`);
            return NextResponse.json({ message, rawResponse: rawData, debugLogs }, { status: 404 });
        }
        
        const leg = bestRoute.legs[0];
        const formattedResult = {
            latestDepartureTime: new Date(leg.departure_time.value * 1000).toISOString(),
            finalArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
            totalDuration: Math.round(leg.duration.value / 60),
            steps: leg.steps.map(formatStep)
        };
        return NextResponse.json({ formattedRoute: formattedResult, rawResponse: rawData, debugLogs });

    } else { // From school
        const route = rawData.routes[0];
        const leg = route.legs[0];
        const formattedResult = {
          totalDuration: Math.round(leg.duration.value / 60),
          estimatedArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
          steps: leg.steps.map(formatStep),
        };
        return NextResponse.json({ formattedRoute: formattedResult, rawResponse: rawData, debugLogs });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    debugLogs.push(`[DEBUG] Error in main handler: ${errorMessage}`);
    console.error('[DEBUG] Error in main handler:', error);
    return NextResponse.json({ message: errorMessage, debugLogs }, { status: 500 });
  }
}
