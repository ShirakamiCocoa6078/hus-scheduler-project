
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2 as LoaderIcon, AlertTriangle, ArrowUp, ArrowDown, Cloudy, Umbrella, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// New interfaces for OpenWeatherMap data
interface WeatherData {
  current: {
    temp: number;
    weather: string;
    icon: string;
  };
  hourly: {
    time: number;
    temp: number;
    icon: string;
    pop: number;
  }[];
  daily: {
    date: string;
    temp_max: number;
    temp_min: number;
    weather: string;
    icon: string;
    pop: number;
  }[];
}

const WeatherIcon = ({ iconCode, alt, size = 52 }: { iconCode: string, alt: string, size?: number }) => (
  <Image
    src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`}
    alt={alt}
    width={size}
    height={size}
    unoptimized
  />
);

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use no-store to ensure the browser doesn't cache the request for manual refresh
      const response = await fetch('/api/weather', { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Server response could not be parsed as JSON." }));
        throw new Error(errorData.message || `HTTP Error! Status: ${response.status}`);
      }
      const data: WeatherData = await response.json();
      if (!data || !data.current || !data.hourly || !data.daily) {
        throw new Error("Weather data from server is incomplete or in the wrong format.");
      }
      setWeather(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  if (isLoading && !weather) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Cloudy className="mr-3 h-6 w-6" /> 天気
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-56">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Cloudy className="mr-3 h-6 w-6" /> 天気
          </CardTitle>
           <Button variant="ghost" size="icon" onClick={fetchWeather} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent className="text-center py-8">
            <div className="mx-auto bg-destructive/10 text-destructive rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground font-semibold">天気情報を読み込めませんでした</p>
            <CardDescription className="text-xs mt-2">
                {error || "데이터가 없습니다."}<br/>しばらくしてから再度お試しください。
            </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const todayForecast = weather.daily[0];

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-headline text-primary">札幌市の天気</CardTitle>
                        <Button variant="ghost" size="icon" onClick={fetchWeather} disabled={isLoading} className="h-7 w-7">
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        </Button>
                    </div>
                    <CardDescription className="capitalize">{weather.current.weather}</CardDescription>
                </div>
                <WeatherIcon iconCode={weather.current.icon} alt={weather.current.weather} size={52} />
            </div>
            <div className="flex items-end justify-between pt-2">
                <span className="text-5xl font-bold text-primary">{weather.current.temp}°C</span>
                <div className="flex flex-col items-end text-sm">
                    {todayForecast.temp_max && <div className="flex items-center text-red-500"><ArrowUp className="h-4 w-4 mr-1"/>{todayForecast.temp_max}°</div>}
                    {todayForecast.temp_min && <div className="flex items-center text-blue-500"><ArrowDown className="h-4 w-4 mr-1"/>{todayForecast.temp_min}°</div>}
                </div>
            </div>
        </CardHeader>

        <CardContent className="pt-0">
            <Tabs defaultValue="hourly">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hourly">時間別</TabsTrigger>
                    <TabsTrigger value="daily">週間</TabsTrigger>
                </TabsList>
                <TabsContent value="hourly" className="mt-4">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-4 pb-4">
                            {weather.hourly.map((hour, index) => (
                                <div key={`hour-${index}`} className="flex flex-col items-center justify-center space-y-1 p-2 rounded-md border border-border flex-shrink-0 w-20">
                                    <p className="text-sm font-medium">{hour.time}時</p>
                                    <WeatherIcon iconCode={hour.icon} alt="weather icon" size={40} />
                                    <p className="font-semibold">{hour.temp}°</p>
                                    <div className="flex items-center text-xs text-blue-400">
                                        <Umbrella className="h-3 w-3 mr-1" />
                                        <span>{hour.pop}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="daily" className="mt-2 space-y-2">
                    {weather.daily.map((day, index) => (
                        <div key={`day-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50">
                            <div className="flex items-center gap-3">
                                <WeatherIcon iconCode={day.icon} alt={day.weather} size={32} />
                                <div>
                                    <p className="font-semibold">{day.date}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{day.weather}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-red-500 w-8 text-right">{day.temp_max}°</span>
                                <span className="text-blue-500 w-8 text-right">{day.temp_min}°</span>
                                <span className="text-blue-400 w-12 text-right flex items-center justify-end gap-1">
                                  <Umbrella className="h-3 w-3" />
                                  {day.pop}%
                                </span>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
             <p className="text-xs text-muted-foreground text-center pt-2">
                Powered by OpenWeatherMap
            </p>
        </CardContent>
    </Card>
  );
}
