
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';

export function useOnboardingStatus() {
  const { data: session, status: authStatus } = useSession();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "loading") {
      setIsLoading(true);
      return;
    }

    if (authStatus === "authenticated" && session?.user) {
      setIsOnboarded(session.user.isSetupComplete === true);
    } else {
      setIsOnboarded(false);
    }
    setIsLoading(false);
  }, [session, authStatus]);

  return { isOnboarded, isLoading };
}
