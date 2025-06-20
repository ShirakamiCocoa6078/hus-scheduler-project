"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrainFront, Bus, TramFront, Clock, ArrowRightLeft, Footprints } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface TransitInfo {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  modeIcon: "train" | "bus" | "tram";
  routeDetails?: string; // e.g., "JR Yamanote Line -> Tokyo Metro Marunouchi Line"
}

const mockTransitInfo: TransitInfo = {
  from: "Shinjuku Station", // Should come from user preferences
  to: "Hongo-sanchome Station", // Should come from user preferences
  departureTime: "08:15",
  arrivalTime: "08:55",
  duration: "40 min",
  modeIcon: "train",
  routeDetails: "JR Chuo Line (Rapid) -> Ochanomizu St. (Walk) -> Tokyo Metro Marunouchi Line",
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
    // Simulate loading user preferences and API call
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const storedHome = localStorage.getItem('user_home_station');
      const storedUni = localStorage.getItem('user_university_station');
      setHomeStation(storedHome || "Your Home St.");
      setUniStation(storedUni || "University St.");
    }


    setTimeout(() => {
      // In a real app, fetch from Google Maps Directions API using user's stations.
      // This would require an API key and careful handling of requests.
      // For now, we use mock data.
      setTransit({
        ...mockTransitInfo,
        from: homeStation || mockTransitInfo.from,
        to: uniStation || mockTransitInfo.to,
      });
      setIsLoading(false);
    }, 1200);
  }, [homeStation, uniStation]); // Rerun if stations change (they don't in this mock)

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <TrainFront className="mr-3 h-6 w-6" /> Transit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!transit || !homeStation || !uniStation) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <TrainFront className="mr-3 h-6 w-6" /> Transit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Image src="https://placehold.co/200x150.png" alt="Transit error placeholder" width={200} height={150} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="map route" />
          <p className="text-muted-foreground">Could not load transit data.</p>
          <CardDescription className="text-xs mt-2">
            Please set your home and university stations in onboarding. Real data requires Google Maps API.
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
          Commute to University
        </CardTitle>
        <CardDescription>Route from {transit.from} to {transit.to}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-md bg-primary/10">
          <div>
            <p className="text-sm text-muted-foreground">Departure</p>
            <p className="text-2xl font-semibold text-accent">{transit.departureTime}</p>
          </div>
          <ArrowRightLeft className="h-6 w-6 text-primary/70" />
          <div>
            <p className="text-sm text-muted-foreground">Arrival</p>
            <p className="text-2xl font-semibold text-accent">{transit.arrivalTime}</p>
          </div>
        </div>
        
        <div className="flex items-center text-md">
          <Clock className="mr-2 h-5 w-5 text-primary/80" />
          <span>Total Duration: <strong>{transit.duration}</strong></span>
        </div>

        {transit.routeDetails && (
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Route Details:</p>
            <p className="text-muted-foreground bg-secondary/30 p-2 rounded-md">{transit.routeDetails}</p>
          </div>
        )}
        
        {/* Placeholder for a small map image */}
        <div className="mt-2">
            <Image 
                src="https://placehold.co/400x200.png" 
                alt="Placeholder map of transit route" 
                width={400} 
                height={200} 
                className="rounded-md object-cover w-full"
                data-ai-hint="transit map"
            />
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Transit data is illustrative. Set up API for live info.
        </p>
      </CardContent>
    </Card>
  );
}

// Loader component if not using lucide-react globally
const Loader2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
