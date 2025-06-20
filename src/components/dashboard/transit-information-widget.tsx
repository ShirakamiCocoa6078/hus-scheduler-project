
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrainFront, Bus, TramFront, Clock, ArrowRightLeft, Footprints, Loader2 as LoaderIcon } from "lucide-react"; // Renamed Loader2 to avoid conflict
import Image from "next/image";
import { useEffect, useState } from "react";

interface TransitInfo {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  modeIcon: "train" | "bus" | "tram";
  routeDetails?: string; 
}

const mockTransitInfo: TransitInfo = {
  from: "手稲駅", 
  to: "手稲駅", 
  departureTime: "08:15",
  arrivalTime: "08:55",
  duration: "40 分",
  modeIcon: "train",
  routeDetails: "JR函館本線 -> 徒歩 -> 大学",
};


const TransitIcon = ({ mode, className }: { mode: TransitInfo["modeIcon"], className?: string }) => {
  const props = {className: `h-6 w-6 ${className}`};
  switch(mode) {
    case "train": return <TrainFront {...props} />;
    case "bus": return <Bus {...props} />;
    case "tram": return <TramFront {...props} />;
    default: return <TrainFront {...props} />;
  }
}

export function TransitInformationWidget() {
  const [transit, setTransit] = useState<TransitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [homeStation, setHomeStation] = useState<string | null>(null);
  const [uniStation, setUniStation] = useState<string | null>(null);


  useEffect(() => {
    setIsLoading(true);
    let effectiveHomeStation = "自宅の駅";
    let effectiveUniStation = "大学の駅";

    if (typeof window !== 'undefined') {
      const storedHome = localStorage.getItem('user_home_station');
      const storedUni = localStorage.getItem('user_university_station');
      if (storedHome) effectiveHomeStation = storedHome;
      if (storedUni) effectiveUniStation = storedUni;
      setHomeStation(effectiveHomeStation);
      setUniStation(effectiveUniStation);
    }

    setTimeout(() => {
      setTransit({
        ...mockTransitInfo,
        from: effectiveHomeStation,
        to: effectiveUniStation,
      });
      setIsLoading(false);
    }, 1200);
  }, []); // Run once on mount

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <TrainFront className="mr-3 h-6 w-6" /> 通学情報
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!transit || !homeStation || !uniStation) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <TrainFront className="mr-3 h-6 w-6" /> 通学情報
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Image src="https://placehold.co/200x150.png" alt="交通情報エラーのプレースホルダー" width={200} height={150} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="map route" />
          <p className="text-muted-foreground">交通情報を読み込めませんでした。</p>
          <CardDescription className="text-xs mt-2">
            オンボーディングで自宅と大学の最寄駅を設定してください。実際のデータにはGoogle Maps APIが必要です。
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <TransitIcon mode={transit.modeIcon} className="mr-3" />
          大学への通勤
        </CardTitle>
        <CardDescription>経路：{transit.from} から {transit.to}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-md bg-primary/10">
          <div>
            <p className="text-sm text-muted-foreground">出発</p>
            <p className="text-2xl font-semibold text-accent">{transit.departureTime}</p>
          </div>
          <ArrowRightLeft className="h-6 w-6 text-primary/70" />
          <div>
            <p className="text-sm text-muted-foreground">到着</p>
            <p className="text-2xl font-semibold text-accent">{transit.arrivalTime}</p>
          </div>
        </div>
        
        <div className="flex items-center text-md">
          <Clock className="mr-2 h-5 w-5 text-primary/80" />
          <span>所要時間: <strong>{transit.duration}</strong></span>
        </div>

        {transit.routeDetails && (
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">経路詳細:</p>
            <p className="text-muted-foreground bg-secondary/30 p-2 rounded-md">{transit.routeDetails}</p>
          </div>
        )}
        
        <div className="mt-2">
            <Image 
                src="https://placehold.co/400x200.png" 
                alt="交通経路のプレースホルダー地図" 
                width={400} 
                height={200} 
                className="rounded-md object-cover w-full"
                data-ai-hint="transit map"
            />
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          交通データは例示です。ライブ情報のためにはAPIを設定してください。
        </p>
      </CardContent>
    </Card>
  );
}
