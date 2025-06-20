"use client";

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'hus_scheduler_onboarded';

export function useOnboardingStatus() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false); // Default to false
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem(ONBOARDING_KEY);
        setIsOnboarded(storedValue === 'true');
      } catch (error) {
        console.error("Failed to read onboarding status from localStorage", error);
        setIsOnboarded(false); 
      } finally {
        setIsLoading(false);
      }
    } else {
        // For server-side rendering or initial static generation, assume loading and not onboarded
        setIsLoading(false); // Or true if you want to show loading until client hydration
        setIsOnboarded(false);
    }
  }, []);

  const setOnboardedStatus = useCallback((status: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ONBOARDING_KEY, String(status));
        setIsOnboarded(status);
      } catch (error) {
        console.error("Failed to write onboarding status to localStorage", error);
      }
    }
  }, []);

  return { isOnboarded, setOnboardedStatus, isLoading };
}
