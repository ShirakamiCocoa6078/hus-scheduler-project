
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Element } from 'cheerio';

const prisma = new PrismaClient();
const CACHE_DURATION_HOURS = 1;

interface HourlyForecast {
    time: string;
    temp: string;
    precip: string;
    iconUrl: string;
}

interface WeeklyForecast {
    date: string;
    dayOfWeek: string;
    weather: string;
    iconUrl: string;
    maxTemp: string;
    minTemp: string;
    precip: string;
}

interface WeatherData {
    location: string;
    current: {
        temp: string;
        description: string;
        iconUrl: string;
    };
    today: {
        maxTemp: string;
        minTemp: string;
        precip: string;
    };
    hourly: HourlyForecast[];
    weekly: WeeklyForecast[];
}

function parseHourlyForecast($: cheerio.CheerioAPI): HourlyForecast[] {
    const hourly: HourlyForecast[] = [];
    $('div[data-ga-label="hourly-forecast"] .yjw_table_pinpoint_hourly tbody tr').first().find('td').each((i, el) => {
        const time = $(el).find('.time').text().trim();
        const temp = $(el).find('.temp').text().trim();
        const precip = $(el).find('.precip').text().trim();
        const iconUrl = $(el).find('img').attr('src') || '';
        if (time) {
            hourly.push({ time, temp, precip, iconUrl });
        }
    });
    return hourly;
}


function parseWeeklyForecast($: cheerio.CheerioAPI): WeeklyForecast[] {
    const weekly: WeeklyForecast[] = [];
    $('.yjw_table_week tbody tr').each((i, el) => {
        const dateEl = $(el).find('.date');
        const date = dateEl.find('em').text().trim();
        const dayOfWeek = dateEl.text().replace(date, '').trim();

        const weather = $(el).find('.weather .pict').text().trim();
        const iconUrl = $(el).find('.weather img').attr('src') || '';
        
        const maxTemp = $(el).find('.temp .high').text().trim();
        const minTemp = $(el).find('.temp .low').text().trim();
        const precip = $(el).find('.precip').text().trim();

        if (date) {
            weekly.push({ date, dayOfWeek, weather, iconUrl, maxTemp, minTemp, precip });
        }
    });
    return weekly;
}

async function scrapeYahooWeather(): Promise<WeatherData | null> {
    const url = 'https://weather.yahoo.co.jp/weather/jp/1b/1400/1109.html'; // Sapporo, Teine-ku
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);

        const location = $('.yjw_main_md .namedata').text().trim() || '札幌(手稲)';

        const current = {
            temp: $('.yjw_main_md .temp .value').text().trim(),
            description: $('.yjw_main_md .pict p').text().trim(),
            iconUrl: $('.yjw_main_md .pict img').attr('src') || '',
        };

        const today = {
            maxTemp: $('.yjw_main_md .temp .high span').text().trim(),
            minTemp: $('.yjw_main_md .temp .low span').text().trim(),
            precip: $('.yjw_precip_dia .precip').first().text().trim(),
        };

        const hourly = parseHourlyForecast($);
        const weekly = parseWeeklyForecast($);

        return { location, current, today, hourly, weekly };
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
