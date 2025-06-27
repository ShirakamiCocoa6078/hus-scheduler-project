
"use client";
 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { Loader2 } from "lucide-react";

export default function InitialRedirectPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { isOnboarded, isLoading: isOnboardingLoading } = useOnboardingStatus();
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  useEffect(() => {
    if (!isClientRendered || authStatus === "loading" || isOnboardingLoading) {
      return; 
    }

    if (authStatus === "authenticated") {
      // Check the isSetupComplete flag from the session
      if (session?.user?.isSetupComplete) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
    } else if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [isClientRendered, session, authStatus, isOnboarded, isOnboardingLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-headline text-primary">HUS-scheduler</h1>
      <p className="text-muted-foreground">読み込み中...</p>
    </div>
  );
}
