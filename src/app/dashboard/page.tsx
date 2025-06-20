"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { CourseScheduleWidget } from "@/components/dashboard/course-schedule-widget";
import { TaskManagementWidget } from "@/components/dashboard/task-management-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { TransitInformationWidget } from "@/components/dashboard/transit-information-widget";
import { Loader2, LayoutDashboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const WidgetSkeleton = () => (
  <Card className="shadow-lg">
    <CardHeader>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { isOnboarded, isLoading: isOnboardingLoading } = useOnboardingStatus();
  const [isClientRendered, setIsClientRendered] = useState(false);
  const [userName, setUserName] = useState<string | null | undefined>(null);


  useEffect(() => {
    setIsClientRendered(true);
  }, []);
  
  useEffect(() => {
    if(session?.user?.name) {
      setUserName(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    if (!isClientRendered || authStatus === "loading" || isOnboardingLoading) return;

    if (authStatus === "unauthenticated") {
      router.replace("/login");
    } else if (authStatus === "authenticated" && !isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isClientRendered, authStatus, isOnboarded, isOnboardingLoading, router]);

  if (!isClientRendered || authStatus === "loading" || isOnboardingLoading || (authStatus === "authenticated" && !isOnboarded)) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }
  
  if (authStatus === "unauthenticated") {
     // This case should be handled by the redirect effect, but as a fallback:
    return null;
  }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline text-primary">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-lg text-muted-foreground">Here's your overview for today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <CourseScheduleWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <TaskManagementWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <WeatherWidget />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <TransitInformationWidget />
        </Suspense>
        
        {/* Placeholder for more widgets */}
        <Card className="md:col-span-1 xl:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-primary flex items-center">
              <LayoutDashboard className="mr-3 h-6 w-6" />
              More Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Image src="https://placehold.co/300x200.png" alt="Feature coming soon placeholder" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="placeholder abstract" />
              <p className="text-muted-foreground font-medium text-lg">More widgets coming soon!</p>
              <p className="text-sm text-muted-foreground">Stay tuned for updates.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dummy Card components for Skeleton, if not globally available/imported
const Card = ({ className, children }: {className?: string, children: React.ReactNode}) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>;
const CardHeader = ({ className, children }: {className?: string, children: React.ReactNode}) => <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>;
const CardTitle = ({ className, children }: {className?: string, children: React.ReactNode}) => <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)}>{children}</h3>;
const CardContent = ({ className, children }: {className?: string, children: React.ReactNode}) => <div className={cn("p-6 pt-0", className)}>{children}</div>;
import { cn } from "@/lib/utils"; // For dummy Card components
