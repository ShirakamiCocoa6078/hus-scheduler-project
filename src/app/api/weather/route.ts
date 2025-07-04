// 파일 경로: /app/api/weather/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'cheerio';

const prisma = new PrismaClient();
const CACHE_DURATION_HOURS = 1;

// --- 데이터 구조 정의 (인터페이스) ---
interface HourlyForecast {
    time: string;
    weather: string;
    icon_url: string | undefined;
    temperature_c: string;
    humidity_percent: string;
    precipitation_mm: string;
    wind_direction: string | null;
    wind_speed_ms: string | null;
}

interface WeeklyForecast {
    date: string;
    weather: string;
    icon_url: string | undefined;
    temp_high_c: string | null;
    temp_low_c: string | null;
    precipitation_percent: string;
}

// --- 웹 스크레이핑을 위한 헬퍼 함수 ---
function parseHourlyForecast($: cheerio.CheerioAPI, element: Element | undefined): HourlyForecast[] {
    if (!element) return [];
    const table = $(element).find('table.yjw_table2');
    if (table.length === 0) return [];

    const headers = table.find('tr').first().find('td').slice(1).map((i, el) => $(el).text().trim()).get();
    const dataRows = table.find('tr').slice(1);
    const hourlyData: HourlyForecast[] = [];

    const weatherRow = $(dataRows[0]).find('td').slice(1);
    const tempRow = $(dataRows[1]).find('td').slice(1);
    const humidityRow = $(dataRows[2]).find('td').slice(1);
    const precipitationRow = $(dataRows[3]).find('td').slice(1);
    const windRow = $(dataRows[4]).find('td').slice(1);

    for (let i = 0; i < headers.length; i++) {
        const windInfo = $(windRow[i]).text().trim().split(/\s+/);
        hourlyData.push({
            time: headers[i],
            weather: $(weatherRow[i]).text().trim(),
            icon_url: $(weatherRow[i]).find('img').attr('src'),
            temperature_c: $(tempRow[i]).text().trim(),
            humidity_percent: $(humidityRow[i]).text().trim(),
            precipitation_mm: $(precipitationRow[i]).text().trim(),
            wind_direction: windInfo[0] || null,
            wind_speed_ms: windInfo[1] || null,
        });
    }
    return hourlyData;
}

function parseWeeklyForecast($: cheerio.CheerioAPI, element: Element | undefined): WeeklyForecast[] {
    if (!element) return [];
    const table = $(element).find('table.yjw_table');
    if (table.length === 0) return [];

    const headers = table.find('tr').first().find('td').slice(1).map((i, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    const weeklyData: WeeklyForecast[] = [];

    const weatherRow = table.find('tr').eq(1).find('td').slice(1);
    const tempRow = table.find('tr').eq(2).find('td').slice(1);
    const precipRow = table.find('tr').eq(3).find('td').slice(1);

    for (let i = 0; i < headers.length; i++) {
        const tempInfo = $(tempRow[i]).text().trim().split(/\s+/);
        weeklyData.push({
            date: headers[i],
            weather: $(weatherRow[i]).text().trim(),
            icon_url: $(weatherRow[i]).find('img').attr('src'),
            temp_high_c: tempInfo[0] || null,
            temp_low_c: tempInfo[1] || null,
            precipitation_percent: $(precipRow[i]).text().trim(),
        });
    }
    return weeklyData;
}

async function scrapeYahooWeather() {
  const url = 'https://weather.yahoo.co.jp/weather/jp/1b/1400/1109.html';
  console.log(`[Weather API] 스크레이핑 시작: ${url}`);
  
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const todayForecastDiv = $('#yjw_pinpoint_today').get(0);
  const tomorrowForecastDiv = $('#yjw_pinpoint_tomorrow').get(0);
  const weeklyForecastDiv = $('#yjw_week').get(0);
  
  return {
      today: parseHourlyForecast($, todayForecastDiv),
      tomorrow: parseHourlyForecast($, tomorrowForecastDiv),
      weekly: parseWeeklyForecast($, weeklyForecastDiv)
  };
}


// --- API 메인 핸들러 ---
export async function GET() {
  const locationKey = "sapporo_teine";
  console.log(`[Weather API] '${locationKey}'의 날씨 정보 요청 수신.`);

  try {
    const cachedData = await prisma.weather.findUnique({
      where: { locationKey },
    });

    if (cachedData) {
      const now = new Date();
      const cacheExpiry = new Date(cachedData.updatedAt.getTime() + CACHE_DURATION_HOURS * 60 * 60 * 1000);
      
      if (now < cacheExpiry) {
        console.log("[Weather API] 유효한 캐시 데이터를 반환합니다. 캐시 데이터:", JSON.stringify(cachedData.data, null, 2));
        return NextResponse.json(cachedData.data);
      }
    }

    console.log("[Weather API] 캐시가 없거나 만료되어 새로운 데이터를 스크레이핑합니다.");
    const newWeatherData = await scrapeYahooWeather();

    if (!newWeatherData || newWeatherData.today.length === 0) {
      // If scraping fails, but we have stale data, serve it as a fallback
      if (cachedData) {
          console.warn('[Weather API] 스크레이핑 실패, 오래된 캐시 데이터를 대신 반환합니다.');
          return NextResponse.json(cachedData.data);
      }
      throw new Error("스크레이핑에 실패했거나 유효한 데이터를 가져오지 못했습니다.");
    }

    console.log('[Weather API] 스크레이핑 완료. 수집된 데이터:', JSON.stringify(newWeatherData, null, 2));
    
    const newWeatherDataAsJson = newWeatherData as any;

    console.log("[Weather API] 데이터베이스에 새로운 날씨 정보를 저장(upsert)합니다.");
    const updatedWeather = await prisma.weather.upsert({
      where: { locationKey },
      update: { data: newWeatherDataAsJson, updatedAt: new Date() },
      create: { locationKey, data: newWeatherDataAsJson },
    });
    
    console.log('[Weather API] 데이터베이스 업데이트 완료. 저장된 데이터:', JSON.stringify(updatedWeather.data, null, 2));

    return NextResponse.json(updatedWeather.data);

  } catch (error) {
    console.error('[Weather API] API 처리 중 심각한 오류 발생:', error);
     // Final fallback: try to serve stale data one last time in the catch block
    const staleData = await prisma.weather.findUnique({ where: { locationKey } });
    if (staleData) {
        console.warn("[Weather API] API 처리 중 오류 발생, 오래된 캐시 데이터를 대신 반환합니다.");
        return NextResponse.json(staleData.data);
    }
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 서버 오류가 발생했습니다.';
    return NextResponse.json({ message: '날씨 정보를 가져오는 데 실패했습니다.', error: errorMessage }, { status: 500 });
  }
}
