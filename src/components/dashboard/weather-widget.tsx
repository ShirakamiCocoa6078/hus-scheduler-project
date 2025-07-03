
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Thermometer, Wind, Droplets, Loader2 as LoaderIcon, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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
                const errorData = await response.json();
                throw new Error(errorData.message || '날씨 정보 로딩 실패');
            }
            const data: WeatherData = await response.json();
            setWeather(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "알 수 없는 오류 발생";
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
        <CardContent className="flex items-center justify-center h-56">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !weather) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Thermometer className="mr-3 h-6 w-6" /> 天気
          </CardTitle>
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

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl font-headline text-primary">{weather.location}の天気</CardTitle>
                    <CardDescription>{weather.current.description}</CardDescription>
                </div>
                 {weather.current.iconUrl && (
                    <Image src={weather.current.iconUrl} alt={weather.current.description} width={52} height={52} className="-mt-2"/>
                )}
            </div>
            <div className="flex items-end justify-between pt-2">
                <span className="text-5xl font-bold text-primary">{weather.current.temp}°C</span>
                <div className="flex flex-col items-end text-sm">
                    <div className="flex items-center text-red-500"><ArrowUp className="h-4 w-4 mr-1"/>{weather.today.maxTemp}°</div>
                    <div className="flex items-center text-blue-500"><ArrowDown className="h-4 w-4 mr-1"/>{weather.today.minTemp}°</div>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div className="flex items-center">
                    <Droplets className="mr-2 h-5 w-5 text-primary/70" />
                    <span>湿度: {weather.today.precip}%</span>
                </div>
            </div>
        </CardHeader>

        <CardContent className="pt-0">
            <Tabs defaultValue="hourly">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="hourly">時間別</TabsTrigger>
                    <TabsTrigger value="weekly">週間</TabsTrigger>
                </TabsList>
                <TabsContent value="hourly" className="mt-4">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex space-x-4 pb-4">
                            {weather.hourly.map((hour, index) => (
                                <div key={index} className="flex flex-col items-center justify-center space-y-1 p-2 rounded-md border border-border flex-shrink-0 w-20">
                                    <p className="text-sm font-medium">{hour.time}時</p>
                                    {hour.iconUrl && <Image src={hour.iconUrl} alt="weather icon" width={32} height={32}/>}
                                    <p className="font-semibold">{hour.temp}°</p>
                                    <div className="flex items-center text-xs text-blue-400">
                                        <Droplets className="h-3 w-3 mr-1" />
                                        <span>{hour.precip}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="weekly" className="mt-2 space-y-2">
                    {weather.weekly.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50">
                            <div className="flex items-center gap-3">
                                {day.iconUrl && <Image src={day.iconUrl} alt={day.weather} width={32} height={32}/>}
                                <div>
                                    <p className="font-semibold">{day.date} ({day.dayOfWeek})</p>
                                    <p className="text-xs text-muted-foreground">{day.weather}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-red-500">{day.maxTemp}°</span>
                                <span className="text-blue-500">{day.minTemp}°</span>
                                <span className="text-blue-400 w-12 text-right">{day.precip}</span>
                            </div>
                        </div>
                    ))}
                </TabsContent>
            </Tabs>
             <p className="text-xs text-muted-foreground text-center pt-2">
                出典: Yahoo!天気・災害
            </p>
        </CardContent>
    </Card>
  );
}
