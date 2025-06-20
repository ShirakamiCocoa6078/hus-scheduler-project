"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

// A simple SVG Google icon. In a real app, you might use a library or a more detailed SVG.
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.001-0.001l6.19,5.238C39.99,36.088,44,30.617,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const nextAuthError = searchParams.get("error");
    if (nextAuthError) {
      if (nextAuthError === "OAuthAccountNotLinked") {
        setError("This email is already linked with another account. Try a different login method.");
        toast({
          title: "Login Error",
          description: "This email is already linked with another account. Try a different login method.",
          variant: "destructive",
        });
      } else if (nextAuthError === "DomainMismatch") {
         setError("Access is restricted to @stu.hus.ac.jp emails. Please use your university Google account.");
         toast({
          title: "Access Denied",
          description: "Access is restricted to @stu.hus.ac.jp emails. Please use your university Google account.",
          variant: "destructive",
        });
      } else {
        setError("An unknown error occurred during login. Please try again.");
        toast({
          title: "Login Error",
          description: "An unknown error occurred during login. Please try again.",
          variant: "destructive",
        });
      }
      // Clean the URL by removing the error query parameter
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Let the root page handle redirect to dashboard or onboarding
    }
  }, [session, status, router]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      // The redirect will be handled by NextAuth itself if successful.
      // If there's an error handled by NextAuth (like domain mismatch in our callback),
      // it will redirect back here, and the useEffect for searchParams will pick it up.
      await signIn("google", { callbackUrl: "/", redirect: false });
      // If signIn with redirect: false returns an error, it means immediate failure (e.g. popup closed)
      // This is less common for Google OAuth button flow as it usually redirects.
      // We'll check status for "authenticated" or rely on the searchParams error handling.
      // For now, just setting isLoading to false if it doesn't redirect (which it should).
      
      // Check if session status changes quickly to authenticated
      // This is a bit of a race, usually the redirect happens.
      // The useEffect for status === "authenticated" is more reliable.
      const res = await signIn("google", { callbackUrl: "/", redirect: false });
      if (res?.error) {
          // This error is usually when the user closes the popup or there's a network issue before Google redirect.
          // More specific errors from Google (like account issues) or our callback (domain mismatch)
          // will come via the callbackUrl's query parameters.
          setError(res.error === "Callback" ? "Login cancelled or failed. Please try again." : res.error);
          toast({
            title: "Login Failed",
            description: res.error === "Callback" ? "Login cancelled or failed. Please try again." : res.error,
            variant: "destructive",
          });
          setIsLoading(false);
      } else if (!res?.url) {
        // If no URL, it means no redirect is happening, potentially an issue or successful immediate sign-in (rare)
        setIsLoading(false);
      }
      // If res.url is present, NextAuth is handling the redirect. isLoading stays true until page navigation.

    } catch (error) {
      console.error("Login failed unexpectedly:", error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">HUS-scheduler</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to manage your university life.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full text-base py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            aria-label="Sign in with Google"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Sign in with Google</span>
          </Button>
          <p className="text-xs text-center text-muted-foreground px-4">
            Access is restricted to users with a <strong>@stu.hus.ac.jp</strong> email address.
            By signing in, you agree to our imaginary Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
