
import { NextResponse, type NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parse, format, addMinutes, subMinutes, isBefore, isAfter, set, getDay } from 'date-fns';

interface TimeTable {
  trains: {
    [line: string]: {
      [route: string]: {
        duration_minutes: number;
        weekdays: string[];
        weekends: string[];
      };
    };
  };
  buses: {
    [stop: string]: {
      [line: string]: {
        duration_minutes: number;
        weekdays: string[];
        weekends: string[];
      };
    };
  };
  walk_times: {
    [route: string]: number;
  };
}

// --- Helper Functions ---

// Function to get today's date with a specific HH:mm time
function getTodayAtTime(timeStr: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
}

// Function to find the latest departure that arrives by a deadline
function findLatestDeparture(schedule: string[], duration: number, deadline: Date): { departure: Date; arrival: Date } | null {
  let bestOption = null;
  for (const timeStr of [...schedule].reverse()) {
    const departureTime = getTodayAtTime(timeStr, deadline);
    const arrivalTime = addMinutes(departureTime, duration);
    if (isBefore(arrivalTime, deadline) || arrivalTime.getTime() === deadline.getTime()) {
      bestOption = { departure: departureTime, arrival: arrivalTime };
      break;
    }
  }
  return bestOption;
}

// Function to find the next N departures after a certain time
function findNextDepartures(schedule: string[], duration: number, afterTime: Date, count: number = 3): { departure: Date; arrival: Date }[] {
  const options = [];
  for (const timeStr of schedule) {
    const departureTime = getTodayAtTime(timeStr, afterTime);
    if (isAfter(departureTime, afterTime) || departureTime.getTime() === afterTime.getTime()) {
      const arrivalTime = addMinutes(departureTime, duration);
      options.push({ departure: departureTime, arrival: arrivalTime });
      if (options.length >= count) break;
    }
  }
  return options;
}


// --- Main API Handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, originStation, destinationStation, arrivalDeadlineStr, dayType } = body;

    // 1. Load Timetable Data
    const jsonPath = path.join(process.cwd(), 'data', 'timetable.json');
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const timetable: TimeTable = JSON.parse(jsonData);

    const today = new Date();
    const scheduleKey = dayType === 'weekday' ? 'weekdays' : 'weekends';

    if (type === 'to_school') {
      // --- Logic for "Going to School" ---
      if (!arrivalDeadlineStr || !originStation) {
        return NextResponse.json({ message: 'Missing required parameters for to_school' }, { status: 400 });
      }
      
      const arrivalDeadline = getTodayAtTime(arrivalDeadlineStr);

      // Step 1: Find the last bus to HUS
      const busSchedule = timetable.buses.from_teine_station.line_te72[scheduleKey];
      const busDuration = timetable.buses.from_teine_station.line_te72.duration_minutes;
      const lastBus = findLatestDeparture(busSchedule, busDuration, arrivalDeadline);

      if (!lastBus) {
        return NextResponse.json({ message: 'No available bus found for the given arrival time.' }, { status: 404 });
      }

      // Step 2: Calculate required arrival time at Teine Station
      const walkDuration = timetable.walk_times.teine_station_to_bus_stop;
      const requiredTrainArrival = subMinutes(lastBus.departure, walkDuration);

      // Step 3: Find the last train to Teine Station
      const trainSchedule = timetable.trains.hakodate_line.sapporo_to_teine[scheduleKey];
      const trainDuration = timetable.trains.hakodate_line.sapporo_to_teine.duration_minutes;
      const lastTrain = findLatestDeparture(trainSchedule, trainDuration, requiredTrainArrival);
      
      if (!lastTrain) {
         return NextResponse.json({ message: 'No available train found to connect to the last bus.' }, { status: 404 });
      }

      // Mock real-time info
      const realtimeInfo = {
        train: { status: '정상 운행', delay_minutes: 0 },
        bus: { status: '정상 운행', delay_minutes: 0 }
      };

      // Step 4: Format and return result
      const result = {
        recommendedDepartureTime: format(lastTrain.departure, "HH:mm"),
        finalArrivalTime: format(lastBus.arrival, "HH:mm"),
        steps: [
          {
            type: 'TRAIN',
            line: 'JR函館本線',
            from: '札幌駅',
            to: '手稲駅',
            departureTime: format(lastTrain.departure, "HH:mm"),
            arrivalTime: format(lastTrain.arrival, "HH:mm"),
            duration: trainDuration,
            realtime_info: realtimeInfo.train
          },
          {
            type: 'WALK',
            from: '手稲駅',
            to: '手稲駅南口バス停',
            duration: walkDuration,
          },
          {
            type: 'BUS',
            line: '手72',
            from: '手稲駅南口',
            to: '北海道科学大学',
            departureTime: format(lastBus.departure, "HH:mm"),
            arrivalTime: format(lastBus.arrival, "HH:mm"),
            duration: busDuration,
            realtime_info: realtimeInfo.bus
          }
        ]
      };
      
      return NextResponse.json(result);

    } else if (type === 'from_school') {
      // --- Logic for "Going Home" ---
       if (!destinationStation) {
        return NextResponse.json({ message: 'Missing destinationStation for from_school' }, { status: 400 });
      }
      
      const currentTime = new Date();

      // Step 1: Find next buses from HUS
      const busSchedule = timetable.buses.from_teine_station.line_te72[scheduleKey]; // Note: Using same schedule for simplicity, would need reverse schedule in real app
      const busDuration = timetable.buses.from_teine_station.line_te72.duration_minutes;
      const nextBuses = findNextDepartures(busSchedule, busDuration, currentTime, 3);
      
      if (nextBuses.length === 0) {
        return NextResponse.json({ message: 'No more buses available from school today.' }, { status: 404 });
      }
      
      const results = [];
      const trainSchedule = timetable.trains.hakodate_line.teine_to_sapporo[scheduleKey];
      const trainDuration = timetable.trains.hakodate_line.teine_to_sapporo.duration_minutes;
      const walkDuration = timetable.walk_times.teine_station_to_bus_stop; // Assuming same walk time

      for(const bus of nextBuses) {
        const requiredTrainDepartureTime = addMinutes(bus.arrival, walkDuration);
        const nextTrain = findNextDepartures(trainSchedule, trainDuration, requiredTrainDepartureTime, 1)[0];
        
        if (nextTrain) {
          // Mock real-time info
          const realtimeInfo = {
            train: { status: '정상 운행', delay_minutes: 0 },
            bus: { status: '정상 운행', delay_minutes: 0 }
          };

          results.push({
            departureFromSchoolTime: format(bus.departure, "HH:mm"),
            finalArrivalTime: format(nextTrain.arrival, "HH:mm"),
            steps: [
               {
                type: 'BUS',
                line: '手72 (역방향)',
                from: '北海道科学大学',
                to: '手稲駅南口',
                departureTime: format(bus.departure, "HH:mm"),
                arrivalTime: format(bus.arrival, "HH:mm"),
                duration: busDuration,
                realtime_info: realtimeInfo.bus
              },
              {
                type: 'WALK',
                from: '手稲駅南口バス停',
                to: '手稲駅',
                duration: walkDuration,
              },
              {
                type: 'TRAIN',
                line: 'JR函館本線',
                from: '手稲駅',
                to: '札幌駅',
                departureTime: format(nextTrain.departure, "HH:mm"),
                arrivalTime: format(nextTrain.arrival, "HH:mm"),
                duration: trainDuration,
                realtime_info: realtimeInfo.train
              }
            ]
          });
        }
      }

      if (results.length === 0) {
        return NextResponse.json({ message: 'Could not find connecting trains for available buses.' }, { status: 404 });
      }

      return NextResponse.json(results);

    } else {
      return NextResponse.json({ message: 'Invalid request type specified' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in /api/calculate-fixed-route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ message: 'Error processing your request', error: errorMessage }, { status: 500 });
  }
}
