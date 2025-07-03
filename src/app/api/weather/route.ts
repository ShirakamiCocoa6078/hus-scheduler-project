
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'cheerio';

const prisma = new PrismaClient();
const CACHE_DURATION_HOURS = 1;

// Interfaces for the scraped data structure
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

interface WeatherData {
    location: string;
    source: string;
    updatedAt: string;
    today: HourlyForecast[];
    tomorrow: HourlyForecast[];
    weekly: WeeklyForecast[];
}

function parseHourlyForecast($: cheerio.CheerioAPI, element: Element | undefined): HourlyForecast[] {
    if (!element) return [];
    const table = $(element).find('table.yjw_table2');
    if (table.length === 0) return [];

    const headers = table.find('tr').first().find('td').slice(1).map((i, el) => $(el).text().trim()).get();
    const dataRows = table.find('tr').slice(1);
    const hourlyData: HourlyForecast[] = [];

    if (dataRows.length < 5) return [];

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
            wind_speed_ms: windInfo[1] ? windInfo[1].replace('m/s','') : null,
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

    if (table.find('tr').length < 4) return [];

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


async function scrapeYahooWeather(): Promise<WeatherData | null> {
    const url = 'https://weather.yahoo.co.jp/weather/jp/1b/1400/1109.html'; // Sapporo, Teine-ku
    try {
        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(html);

        const todayForecastDiv = $('#yjw_pinpoint_today').get(0);
        const tomorrowForecastDiv = $('#yjw_pinpoint_tomorrow').get(0);
        const weeklyForecastDiv = $('#yjw_week').get(0);
        
        const weatherData: WeatherData = {
            location: "札幌市手稲区",
            source: url,
            updatedAt: new Date().toISOString(),
            today: parseHourlyForecast($, todayForecastDiv),
            tomorrow: parseHourlyForecast($, tomorrowForecastDiv),
            weekly: parseWeeklyForecast($, weeklyForecastDiv)
        };
        
        return weatherData;
    } catch (error) {
        console.error("Scraping failed:", error);
        return null;
    }
}


export async function GET() {
    const locationKey = "sapporo_teine";

    try {
        const cachedData = await prisma.weather.findUnique({
            where: { locationKey },
        });

        const now = new Date();
        const cacheExpiry = new Date();
        cacheExpiry.setHours(now.getHours() - CACHE_DURATION_HOURS);

        if (cachedData && new Date(cachedData.updatedAt) > cacheExpiry) {
            console.log("Serving weather data from cache.");
            return NextResponse.json(cachedData.data);
        }

        console.log("Cache stale or not found. Scraping new weather data...");
        const newWeatherData = await scrapeYahooWeather();

        if (!newWeatherData) {
            throw new Error("Failed to scrape new weather data.");
        }

        const dbPayload = newWeatherData as any;

        await prisma.weather.upsert({
            where: { locationKey },
            update: { data: dbPayload, updatedAt: new Date() },
            create: { locationKey, data: dbPayload },
        });

        console.log("Weather data updated in DB.");
        return NextResponse.json(newWeatherData);

    } catch (error) {
        console.error('Error in weather API:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        // In case of error, try to serve stale cache if it exists
        const staleData = await prisma.weather.findUnique({ where: { locationKey } });
        if (staleData) {
            console.warn("Serving stale weather data due to an error.");
            return NextResponse.json(staleData.data);
        }
        
        return NextResponse.json({ message: '날씨 정보를 가져오는 데 실패했습니다.', error: errorMessage }, { status: 500 });
    }
}
