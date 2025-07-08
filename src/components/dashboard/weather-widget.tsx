"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Thermometer, Wind, Droplets, Loader2 as LoaderIcon, AlertTriangle, Clock, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


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
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "서버 응답을 JSON으로 파싱할 수 없습니다." }));
          throw new Error(errorData.message || `HTTP エラー! Status: ${response.status}`);
        }
        const data: WeatherData = await response.json();
        if (!data || !Array.isArray(data.today) || data.today.length === 0 || !Array.isArray(data.weekly) || data.weekly.length === 0) {
          throw new Error("서버로부터 유효한 날씨 데이터를 받지 못했습니다.");
        }
        setWeather(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 에러 발생";
        setError(message);
      } finally {
        setIsLoading(false);
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
        <CardContent className="flex items-center justify-center h-48">
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
  
  if (!weather) return null;
  
  const currentForecast = weather.today.find(f => parseInt(f.time) >= new Date().getHours()) || weather.today[0];
  const weeklyForecastToday = weather.weekly[0];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center justify-between">
          <span>札幌(手稲)の天気</span>
          {currentForecast.icon_url && <img src={currentForecast.icon_url} alt={currentForecast.weather} className="w-12 h-12" />}
        </CardTitle>
        <CardDescription>{currentForecast.weather}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-center mb-4">
            <p className="text-5xl font-bold text-primary">{currentForecast.temperature_c}°C</p>
            <div className="text-right text-sm">
                <p className="flex items-center justify-end"><TrendingUp className="h-4 w-4 mr-1 text-red-500"/>最高: {weeklyForecastToday.temp_high_c}°C</p>
                <p className="flex items-center justify-end"><TrendingDown className="h-4 w-4 mr-1 text-blue-500"/>最低: {weeklyForecastToday.temp_low_c}°C</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center">
            <Droplets className="mr-2 h-5 w-5 text-primary/70" />
            <span>湿度: {currentForecast.humidity_percent}%</span>
          </div>
          <div className="flex items-center">
            <Wind className="mr-2 h-5 w-5 text-primary/70" />
            <span>{currentForecast.wind_direction} {currentForecast.wind_speed_ms}m/s</span>
          </div>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日</TabsTrigger>
            <TabsTrigger value="tomorrow">明日</TabsTrigger>
            <TabsTrigger value="weekly">週間</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            <ForecastScroller data={weather.today} />
          </TabsContent>
          <TabsContent value="tomorrow" className="mt-4">
            <ForecastScroller data={weather.tomorrow} />
          </TabsContent>
          <TabsContent value="weekly" className="mt-4">
            <div className="space-y-2">
              {weather.weekly.map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-1 rounded-md">
                  <span className="font-medium w-2/5">{day.date}</span>
                  {day.icon_url && <img src={day.icon_url} alt={day.weather} className="w-6 h-6 mx-2 flex-shrink-0" />}
                  <span className="text-muted-foreground w-1/5 text-right">{day.temp_low_c}°</span>
                  <span className="w-1/5 text-right font-semibold">{day.temp_high_c}°</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// 시간별 예보를 가로로 스크롤하여 보여주는 컴포넌트
const ForecastScroller = ({ data }: { data: HourlyData[] }) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md">
      <div className="flex w-max space-x-4 p-2">
        {data.map((forecast, index) => (
          <div key={index} className="flex flex-col items-center justify-center gap-1 p-2 rounded-md border w-20">
            <p className="text-xs font-semibold">{forecast.time}</p>
            {forecast.icon_url && <img src={forecast.icon_url} alt={forecast.weather} className="w-8 h-8" />}
            <p className="text-sm font-bold">{forecast.temperature_c}°</p>
            <p className="text-xs text-blue-500">{forecast.precipitation_mm}mm</p>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
