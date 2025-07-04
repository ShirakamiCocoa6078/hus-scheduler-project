
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Thermometer, Wind, Droplets, Loader2 as LoaderIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";

// API가 보내주는 실제 데이터 구조와 일치하는 타입 정의
interface HourlyData {
  time: string;
  weather: string;
  icon_url?: string;
  temperature_c: string;
  humidity_percent: string;
  precipitation_mm: string;
  wind_direction: string | null;
  wind_speed_ms: string | null;
}

interface DailyData {
    date: string;
    weather: string;
    icon_url?: string;
    temp_high_c: string | null;
    temp_low_c: string | null;
    precipitation_percent: string;
}

interface WeatherData {
  today: HourlyData[];
  tomorrow: HourlyData[];
  weekly: DailyData[];
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);
      console.log("[WeatherWidget] Fetching weather data...");

      try {
        const response = await fetch('/api/weather');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "서버 응답을 JSON으로 파싱할 수 없습니다." }));
          throw new Error(errorData.message || `HTTP 에러! Status: ${response.status}`);
        }
        
        const data: WeatherData = await response.json();
        
        console.log("[WeatherWidget] Parsed API data:", data);

        // 데이터 구조 유효성 검사를 더 강화합니다.
        if (!data || !Array.isArray(data.today) || data.today.length === 0 || !Array.isArray(data.weekly) || data.weekly.length === 0) {
          console.error("[WeatherWidget] Received data is missing required fields or is empty.");
          throw new Error("서버로부터 유효한 날씨 데이터를 받지 못했습니다.");
        }

        setWeather(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 에러 발생";
        console.error("[WeatherWidget] Failed to fetch weather data:", err);
        setError(message);
      } finally {
        setIsLoading(false);
        console.log("[WeatherWidget] Fetch process finished.");
      }
    };

    fetchWeather();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Thermometer className="mr-3 h-6 w-6" /> 天気
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card className="shadow-lg border-destructive">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-destructive flex items-center">
            <AlertTriangle className="mr-3 h-6 w-6" /> 天気情報の取得に失敗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">しばらくしてからページを更新してください。</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!weather) {
    return null; // 데이터가 없는 경우 아무것도 렌더링하지 않음
  }
  
  // 현재 시간에 가장 가까운 예보를 찾습니다.
  const now = new Date();
  const currentHour = now.getHours();
  // 3시간 단위 예보이므로 현재 시간과 가장 가까운 미래 또는 현재의 예보를 찾습니다.
  const currentForecast = weather.today.find(f => parseInt(f.time) >= currentHour) || weather.today[weather.today.length - 1];
  const weeklyForecastToday = weather.weekly[0];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center justify-between">
          <span>札幌(手稲)の天気</span>
          {currentForecast.icon_url && <Image src={currentForecast.icon_url} alt={currentForecast.weather} width={40} height={40} unoptimized />}
        </CardTitle>
        <CardDescription>{currentForecast.weather}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
            <p className="text-5xl font-bold text-primary">{currentForecast.temperature_c}°C</p>
            <div className="text-right">
                <p className="text-sm">最高: {weeklyForecastToday.temp_high_c}°C</p>
                <p className="text-sm">最低: {weeklyForecastToday.temp_low_c}°C</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Droplets className="mr-2 h-5 w-5 text-primary/70" />
            <span>湿度: {currentForecast.humidity_percent}%</span>
          </div>
          <div className="flex items-center">
            <Wind className="mr-2 h-5 w-5 text-primary/70" />
            <span>{currentForecast.wind_direction} {currentForecast.wind_speed_ms}m/s</span>
          </div>
        </div>
        {/* 시간별/주간별 예보를 표시하는 추가 UI를 여기에 구현할 수 있습니다. */}
      </CardContent>
    </Card>
  );
}
