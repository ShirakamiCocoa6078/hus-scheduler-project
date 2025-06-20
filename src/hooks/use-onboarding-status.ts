
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

    if (authStatus === "authenticated" && session?.user?.onboardingData) {
      setIsOnboarded(session.user.onboardingData.completed === true);
    } else {
      setIsOnboarded(false);
    }
    setIsLoading(false);
  }, [session, authStatus]);

  // setOnboardedStatus は外部から直接呼び出されず、セッションの更新によって状態が変化するため、
  // このフックからは削除するか、または何もしない関数として残すことができます。
  // ここでは、状態がセッションに由来することを明確にするため、セッターは提供しません。

  return { isOnboarded, isLoading };
}
