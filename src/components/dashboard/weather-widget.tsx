"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, Wind, Droplets } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Mock weather data structure
interface WeatherData {
  city: string;
  temperature: number; // Celsius
  description: string;
  icon: "sun" | "cloud" | "rain" | "snow";
  humidity: number; // Percentage
  windSpeed: number; // km/h
}

const mockWeatherData: WeatherData = {
  city: "Tokyo",
  temperature: 28,
  description: "Partly Cloudy",
  icon: "cloud",
  humidity: 65,
  windSpeed: 15,
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
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      // In a real app, fetch from OpenWeatherMap API using user's location or a default.
      // const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
      // const city = "Tokyo"; // Or user's city preference
      // fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
      //   .then(res => res.json())
      //   .then(data => {
      //     setWeather({
      //       city: data.name,
      //       temperature: Math.round(data.main.temp),
      //       description: data.weather[0].main, // Simplified
      //       icon: mapIcon(data.weather[0].icon), // map API icon to local ones
      //       humidity: data.main.humidity,
      //       windSpeed: data.wind.speed * 3.6 // m/s to km/h
      //     });
      //   })
      //   .catch(console.error)
      //   .finally(() => setIsLoading(false));
      setWeather(mockWeatherData);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Thermometer className="mr-3 h-6 w-6" /> Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (!weather) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <Thermometer className="mr-3 h-6 w-6" /> Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Image src="https://placehold.co/150x100.png" alt="Weather error placeholder" width={150} height={100} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="error weather" />
          <p className="text-muted-foreground">Could not load weather data.</p>
          <CardDescription className="text-xs mt-2">
            Note: Real weather data requires an OpenWeatherMap API key.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center justify-between">
          <span>Weather in {weather.city}</span>
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
            <span>Humidity: {weather.humidity}%</span>
          </div>
          <div className="flex items-center">
            <Wind className="mr-2 h-5 w-5 text-primary/70" />
            <span>Wind: {weather.windSpeed.toFixed(1)} km/h</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Weather data is illustrative. Set up API for live info.
        </p>
      </CardContent>
    </Card>
  );
}

// Helper to map OpenWeatherMap icons (if you were using the API)
// const mapIcon = (apiIcon: string): WeatherData["icon"] => {
//   if (apiIcon.includes("01")) return "sun"; // clear sky
//   if (apiIcon.includes("02") || apiIcon.includes("03") || apiIcon.includes("04")) return "cloud"; // few/scattered/broken clouds
//   if (apiIcon.includes("09") || apiIcon.includes("10")) return "rain"; // shower/rain
//   if (apiIcon.includes("13")) return "snow"; // snow
//   return "cloud"; // default
// };

// Loader component if not using lucide-react globally
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

