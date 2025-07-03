
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const CACHE_DURATION_HOURS = 1;
const SAPPORO_LAT = 43.06417;
const SAPPORO_LON = 141.34694;

async function fetchOpenWeatherData() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        throw new Error("OpenWeatherMap API 키가 설정되지 않았습니다.");
    }

    // One Call API 3.0 엔드포인트 사용
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${SAPPORO_LAT}&lon=${SAPPORO_LON}&exclude=minutely,alerts&appid=${apiKey}&units=metric&lang=kr`;

    console.log("[Weather API] Fetching data from OpenWeatherMap...");
    const { data } = await axios.get(url);

    // 필요한 데이터만 추출하여 가공
    const processedData = {
        current: {
            temp: Math.round(data.current.temp),
            weather: data.current.weather[0]?.description || '정보 없음',
            icon: data.current.weather[0]?.icon || '01d'
        },
        hourly: data.hourly.slice(0, 24).map((hour: any) => ({
            time: new Date(hour.dt * 1000).getHours(),
            temp: Math.round(hour.temp),
            icon: hour.weather[0]?.icon || '01d',
            pop: Math.round(hour.pop * 100) // 강수 확률
        })),
        daily: data.daily.slice(0, 7).map((day: any) => ({
            date: new Date(day.dt * 1000).toLocaleDateString('ko-KR', { weekday: 'short', month: 'long', day: 'numeric' }),
            temp_max: Math.round(day.temp.max),
            temp_min: Math.round(day.temp.min),
            weather: day.weather[0]?.description || '정보 없음',
            icon: day.weather[0]?.icon || '01d',
            pop: Math.round(day.pop * 100)
        }))
    };
    return processedData;
}


export async function GET() {
  const locationKey = "sapporo_teine_owm"; // 키 이름 변경
  try {
    const cachedData = await prisma.weather.findUnique({ where: { locationKey } });
    const now = new Date();
    const cacheExpiry = new Date(now.getTime() - (CACHE_DURATION_HOURS * 60 * 60 * 1000));

    if (cachedData && new Date(cachedData.updatedAt) > cacheExpiry) {
      console.log("Serving weather from cache.");
      return NextResponse.json(cachedData.data);
    }

    console.log("Fetching new weather data from API.");
    const newWeatherData = await fetchOpenWeatherData();
    
    const dbPayload = newWeatherData as any;

    await prisma.weather.upsert({
      where: { locationKey },
      update: { data: dbPayload, updatedAt: new Date() },
      create: { locationKey, data: dbPayload },
    });

    return NextResponse.json(newWeatherData);
  } catch (error) {
    console.error('Error in weather API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
    
    const staleData = await prisma.weather.findUnique({ where: { locationKey } });
    if (staleData) {
        console.warn("[Weather API] API call failed, serving stale data from cache as fallback.");
        return NextResponse.json(staleData.data);
    }
    
    return NextResponse.json({ message: '날씨 정보 로딩 실패', error: errorMessage }, { status: 500 });
  }
}
