
import { NextResponse, type NextRequest } from 'next/server';
import { nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';


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

// Helper function to get coordinates from an address
async function getCoordinates(
  address: string,
  apiKey: string,
  logs: string[]
): Promise<{ lat: number; lng: number } | null> {
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=ko`;
  logs.push(`[DEBUG] Geocoding URL for "${address}": ${geocodeUrl.replace(apiKey, 'REDACTED')}`);
  try {
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    logs.push(
      `[DEBUG] Geocoding response for "${address}": ${JSON.stringify(
        data,
        null,
        2
      )}`
    );
    if (data.status === 'OK' && data.results[0]?.geometry?.location) {
      const location = data.results[0].geometry.location;
      logs.push(
        `[DEBUG] Found coordinates for "${address}": ${JSON.stringify(location)}`
      );
      return location;
    } else {
      logs.push(
        `[DEBUG] Could not find coordinates for "${address}". Status: ${
          data.status
        }`
      );
      return null;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown geocoding error';
    logs.push(
      `[DEBUG] Error fetching coordinates for "${address}": ${errorMessage}`
    );
    console.error(`[DEBUG] Geocoding API error for "${address}":`, error);
    return null;
  }
}


export async function POST(request: NextRequest) {
  const debugLogs: string[] = [];
  debugLogs.push('[DEBUG] /api/dev/transit-route POST handler started.');

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
  
  const { origin, destination, day, period } = body;
  const apiKey = process.env.Maps_API_KEY;

  if (!apiKey) {
    const errorMsg = '[DEBUG] Google Maps API key is not configured.';
    debugLogs.push(errorMsg);
    console.error(errorMsg);
    return NextResponse.json({ message: 'Google Maps API key is not configured.', debugLogs }, { status: 500 });
  }

  const universityAddress = "北海道札幌市手稲区前田７条１５丁目４−１";
  const isToSchool = !!(origin && day && period);

  try {
    if (isToSchool) {
      // --- 'To School' Logic using 3-step algorithm with actual upcoming day ---
      if (!origin) {
          const errorMsg = 'Origin address is required for "to school" route.';
          debugLogs.push(`[DEBUG] Validation failed: ${errorMsg}`);
          return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
      }
      
      debugLogs.push(`[DEBUG] Mode: To School (3-step algorithm). Getting Coordinates for Origin ("${origin}") and University ("${universityAddress}").`);
      const [originCoords, uniCoords] = await Promise.all([
          getCoordinates(origin, apiKey, debugLogs),
          getCoordinates(universityAddress, apiKey, debugLogs)
      ]);

      if (!originCoords || !uniCoords) {
          const errorMsg = 'Could not find coordinates for origin or university. Check addresses.';
          debugLogs.push(`[DEBUG] ${errorMsg}`);
          return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
      }
      
      const originParam = `${originCoords.lat},${originCoords.lng}`;
      const destinationParam = `${uniCoords.lat},${uniCoords.lng}`;

      // --- 1. Prediction Phase: Get average duration ---
      debugLogs.push(`[DEBUG] Step 1: Predicting average travel time.`);
      const predictionParams = new URLSearchParams({
          origin: originParam,
          destination: destinationParam,
          mode: 'transit',
          key: apiKey,
          language: 'ko',
          region: 'jp',
      });
      const predictionApiUrl = `https://maps.googleapis.com/maps/api/directions/json?${predictionParams.toString()}`;
      debugLogs.push(`[DEBUG] Step 1 (Prediction) URL: ${predictionApiUrl.replace(apiKey, 'REDACTED')}`);

      const predictionResponse = await fetch(predictionApiUrl);
      const predictionData = await predictionResponse.json();
      debugLogs.push(`[DEBUG] Step 1 (Prediction) Raw Response: ${JSON.stringify(predictionData, null, 2)}`);

      if (predictionData.status !== 'OK' || predictionData.routes.length === 0) {
          const message = "경로의 평균 소요 시간을 예측할 수 없습니다. 출발지 또는 도착지를 다시 확인해주세요.";
          debugLogs.push(`[DEBUG] Prediction failed with status: ${predictionData.status}`);
          return NextResponse.json({ message, rawResponse: predictionData, debugLogs }, { status: 500 });
      }
      const avgDurationInSeconds = predictionData.routes[0].legs[0].duration.value;
      debugLogs.push(`[DEBUG] Step 1 Result: Average duration is ${avgDurationInSeconds} seconds.`);

      // --- 2. Calculation Phase: Calculate recommended departure time ---
      debugLogs.push(`[DEBUG] Step 2: Calculating recommended departure time based on selected day and period.`);
      const periodTimes: { [key: string]: { hour: number; minute: number } } = {
        '1': { hour: 9, minute: 0 }, '2': { hour: 10, minute: 30 }, '3': { hour: 13, minute: 0 },
        '4': { hour: 14, minute: 40 }, '5': { hour: 16, minute: 20 },
      };
      const dayFunctions: { [key: string]: (date: Date) => Date } = {
        '월요일': nextMonday, '화요일': nextTuesday, '수요일': nextWednesday,
        '목요일': nextThursday, '금요일': nextFriday, '토요일': nextSaturday, '일요일': nextSunday,
      };

      if (!dayFunctions[day] || !periodTimes[period]) {
        const errorMsg = 'Invalid day or period provided.';
        debugLogs.push(`[DEBUG] Error: ${errorMsg} (day: ${day}, period: ${period})`);
        return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
      }
      
      const targetDayFunction = dayFunctions[day];
      const targetTime = periodTimes[period];
      const arrivalDeadline = targetDayFunction(new Date());
      arrivalDeadline.setHours(targetTime.hour, targetTime.minute, 0, 0);

      const recommendedDepartureTime = new Date(arrivalDeadline.getTime() - avgDurationInSeconds * 1000);
      debugLogs.push(`[DEBUG] Target arrival is ${arrivalDeadline.toISOString()}. Recommended departure is ${recommendedDepartureTime.toISOString()}.`);
      const recommendedDepartureTimestamp = Math.floor(recommendedDepartureTime.getTime() / 1000);

      // --- 3. Finalization Phase: Get final route ---
      debugLogs.push(`[DEBUG] Step 3: Finalizing route with recommended departure time.`);
       const finalParams = new URLSearchParams({
          origin: originParam,
          destination: destinationParam,
          mode: 'transit',
          departure_time: recommendedDepartureTimestamp.toString(),
          key: apiKey,
          language: 'ko',
          region: 'jp',
      });
      const finalApiUrl = `https://maps.googleapis.com/maps/api/directions/json?${finalParams.toString()}`;
      debugLogs.push(`[DEBUG] Step 3 (Finalization) URL: ${finalApiUrl.replace(apiKey, 'REDACTED')}`);
      
      const finalApiResponse = await fetch(finalApiUrl);
      const finalRawData = await finalApiResponse.json();
      debugLogs.push(`[DEBUG] Step 3 (Finalization) Raw Response: ${JSON.stringify(finalRawData, null, 2)}`);
      
      if (finalRawData.status === "OK" && finalRawData.routes.length > 0) {
          const leg = finalRawData.routes[0].legs[0];
          const formattedResult = {
              recommendedDepartureTime: recommendedDepartureTime.toISOString(),
              finalDepartureTime: new Date(leg.departure_time.value * 1000).toISOString(),
              finalArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
              totalDuration: Math.round(leg.duration.value / 60),
              steps: leg.steps.map(formatStep)
          };
          return NextResponse.json({ formattedRoute: formattedResult, rawResponse: finalRawData, debugLogs });
      } else if (finalRawData.status === 'ZERO_RESULTS') {
           const userMessage = "계산된 출발 시간에는 이용 가능한 대중교통 경로를 찾을 수 없습니다. 다른 날짜나 시간으로 다시 시도해 주세요.";
           debugLogs.push(`[DEBUG] API returned ZERO_RESULTS on finalization call. Sending user-friendly message.`);
           return NextResponse.json({ 
               message: userMessage,
               rawResponse: finalRawData,
               debugLogs
           }, { status: 404 });
      } else {
          const errorMessage = finalRawData.error_message || `API returned status: ${finalRawData.status}`;
          const finalErrorMessage = "최종 경로 탐색 중 오류가 발생했습니다.";
          debugLogs.push(`[DEBUG] API Error on finalization call: ${finalErrorMessage}. Details: ${errorMessage}`);
          return NextResponse.json({ 
              message: finalErrorMessage,
              details: errorMessage,
              rawResponse: finalRawData,
              debugLogs
          }, { status: 500 });
      }

    } else { 
      // --- 'From School' Logic with coordinates (Depart Now) ---
      if (!destination) {
          const errorMsg = 'Destination address is required for "from school" route.';
          debugLogs.push(`[DEBUG] Validation failed: ${errorMsg}`);
          return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
      }
      debugLogs.push(`[DEBUG] Mode: From School. Getting Coordinates for University ("${universityAddress}") and Destination ("${destination}").`);
      const [uniCoords, destCoords] = await Promise.all([
          getCoordinates(universityAddress, apiKey, debugLogs),
          getCoordinates(destination, apiKey, debugLogs)
      ]);
      
      if (!uniCoords || !destCoords) {
          const errorMsg = 'Could not find coordinates for university or destination. Check addresses.';
          debugLogs.push(`[DEBUG] ${errorMsg}`);
          return NextResponse.json({ message: errorMsg, debugLogs }, { status: 400 });
      }

      const originParam = `${uniCoords.lat},${uniCoords.lng}`;
      const destinationParam = `${destCoords.lat},${destCoords.lng}`;

      const params = new URLSearchParams({
        origin: originParam,
        destination: destinationParam,
        mode: 'transit',
        language: 'ko',
        region: 'jp',
        key: apiKey,
      });

      // Always use the current time for 'from school' logic
      const departureTimestamp = Math.floor(Date.now() / 1000).toString();
      params.set('departure_time', departureTimestamp);
      debugLogs.push(`[DEBUG] Using explicit current timestamp for departure_time: ${departureTimestamp}`);
      
      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
      debugLogs.push(`[DEBUG] Final Google Maps API URL for 'From School': ${apiUrl.replace(apiKey, 'REDACTED')}`);

      const apiResponse = await fetch(apiUrl);
      const rawData = await apiResponse.json();
      debugLogs.push(`[DEBUG] Raw Google Maps API Response for 'From School': ${JSON.stringify(rawData, null, 2)}`);

      if (rawData.status === "OK" && rawData.routes.length > 0) {
          const route = rawData.routes[0];
          const leg = route.legs[0];
          const formattedResult = {
            totalDuration: Math.round(leg.duration.value / 60),
            estimatedArrivalTime: new Date(leg.arrival_time.value * 1000).toISOString(),
            steps: leg.steps.map(formatStep),
          };
          return NextResponse.json({ formattedRoute: formattedResult, rawResponse: rawData, debugLogs });
      } else if (rawData.status === 'ZERO_RESULTS') {
          const userMessage = "현재 시간에는 이용 가능한 대중교통 경로를 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.";
          debugLogs.push(`[DEBUG] API returned ZERO_RESULTS. Sending user-friendly message.`);
          return NextResponse.json({ 
              message: userMessage,
              rawResponse: rawData,
              debugLogs
          }, { status: 404 });
      } else {
          const errorMessage = rawData.error_message || `API returned status: ${rawData.status}`;
          const finalErrorMessage = "경로 탐색 중 오류가 발생했습니다.";
          debugLogs.push(`[DEBUG] API Error: ${finalErrorMessage}. Details: ${errorMessage}`);
          return NextResponse.json({ 
              message: finalErrorMessage,
              details: errorMessage,
              rawResponse: rawData,
              debugLogs
          }, { status: 500 });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    debugLogs.push(`[DEBUG] Error in main handler: ${errorMessage}`);
    console.error('[DEBUG] Error in main handler:', error);
    return NextResponse.json({ message: errorMessage, debugLogs }, { status: 500 });
  }
}
