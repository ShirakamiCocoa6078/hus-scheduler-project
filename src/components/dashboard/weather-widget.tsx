
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, Wind, Droplets, Loader2 as LoaderIcon } from "lucide-react"; // Renamed Loader2
import Image from "next/image";
import { useEffect, useState } from "react";

interface WeatherData {
  city: string;
  temperature: number; // Celsius
  description: string;
  icon: "sun" | "cloud" | "rain" | "snow";
  humidity: number; // Percentage
  windSpeed: number; // km/h
}

const mockWeatherData: WeatherData = {
  city: "札幌", // Changed to Sapporo for HUS context
  temperature: 18, // Adjusted temperature
  description: "くもり時々晴れ",
  icon: "cloud",
  humidity: 60,
  windSpeed: 10,
};

const WeatherIcon = ({ iconName, className }: { iconName: WeatherData["icon"], className?: string }) => {
  const props = { className: `h-10 w-10 ${className}` };
  switch (iconName) {
    case "sun": return <Sun {...props} />;
    case "cloud": return <Cloud {...props} />;
    case "rain": return <CloudRain {...props} />;
    case "snow": return <CloudSnow {...props} />;
    default: return <Cloud {...props} />;
  }
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setWeather(mockWeatherData);
      setIsLoading(false);
    }, 1000);
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
  
  if (!weather) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Thermometer className="mr-3 h-6 w-6" /> 天気
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Image src="https://placehold.co/150x100.png" alt="天気エラーのプレースホルダー" width={150} height={100} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="error weather" />
          <p className="text-muted-foreground">天気情報を読み込めませんでした。</p>
          <CardDescription className="text-xs mt-2">
            注意：実際の天気データにはOpenWeatherMap APIキーが必要です。
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center justify-between">
          <span>{weather.city}の天気</span>
          <WeatherIcon iconName={weather.icon} className="text-accent" />
        </CardTitle>
        <CardDescription>{weather.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-5xl font-bold text-primary text-center">
          {weather.temperature}°C
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Droplets className="mr-2 h-5 w-5 text-primary/70" />
            <span>湿度: {weather.humidity}%</span>
          </div>
          <div className="flex items-center">
            <Wind className="mr-2 h-5 w-5 text-primary/70" />
            <span>風速: {weather.windSpeed.toFixed(1)} km/h</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          天気データは例示です。ライブ情報のためにはAPIを設定してください。
        </p>
      </CardContent>
    </Card>
  );
}
