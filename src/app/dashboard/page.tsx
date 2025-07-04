
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Loader2, LayoutDashboard } from "lucide-react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { CourseScheduleWidget } from "@/components/dashboard/course-schedule-widget";
import { TaskManagementWidget } from "@/components/dashboard/task-management-widget";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { TransitInformationWidget } from "@/components/dashboard/transit-information-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// WidgetSkeleton을 DashboardPage 컴포넌트 밖으로 이동시켜 불필요한 재정의를 방지합니다.
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
        <p className="text-muted-foreground">ダッシュボードを読み込んでいます...</p>
      </div>
    );
  }
  
  if (authStatus === "unauthenticated") {
    return null;
  }

  const userFirstName = userName ? userName.split(" ")[0] : "";

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline text-primary">
          おかえりなさい{userFirstName ? `、${userFirstName}さん` : ""}！
        </h1>
        <p className="text-lg text-muted-foreground">今日の概要はこちらです。</p>
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
        
        <Card className="md:col-span-1 xl:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-headline text-primary flex items-center">
              <LayoutDashboard className="mr-3 h-6 w-6" />
              その他の機能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Image src="https://placehold.co/300x200.png" alt="近日公開予定の機能のプレースホルダー" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="placeholder abstract" />
              <p className="text-muted-foreground font-medium text-lg">さらに多くのウィジェットが近日公開予定です！</p>
              <p className="text-sm text-muted-foreground">アップデートにご期待ください。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
