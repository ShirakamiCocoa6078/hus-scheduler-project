
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Mail, KeyRound } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [email, setEmail] = useState("1234567@stu.hus.ac.jp");
  const [password, setPassword] = useState("test1234");

  useEffect(() => {
    const nextAuthError = searchParams.get("error");
    if (nextAuthError) {
      let errorMessage = "An unknown error occurred during login. Please try again.";
      if (nextAuthError === "OAuthAccountNotLinked") {
        errorMessage = "This email is already linked with another account. Try a different login method.";
      } else if (nextAuthError === "DomainMismatch") {
         errorMessage = "Access is restricted to @stu.hus.ac.jp emails for Google Sign-In. Please use your university Google account.";
      } else if (nextAuthError === "CredentialsSignin") {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      router.replace('/login', { scroll: false }); // Clean URL
    }
  }, [searchParams, router, toast]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); 
    }
  }, [session, status, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // NextAuth handles redirection or error display via callbackUrl query params
      const res = await signIn("google", { callbackUrl: "/", redirect: true });
      // If redirect: true, this part might not be reached if successful.
      // If signIn fails before redirect (e.g. popup closed, network error), res will have error.
      if (res?.error) {
          const errMessage = res.error === "Callback" ? "Login cancelled or failed. Please try again." : res.error;
          setError(errMessage);
          toast({ title: "Login Failed", description: errMessage, variant: "destructive" });
          setIsGoogleLoading(false);
      }
      // If successful redirect, isLoading will persist until page navigation
    } catch (err) {
      console.error("Google Sign-In failed unexpectedly:", err);
      setError("An unexpected error occurred with Google Sign-In. Please try again.");
      toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setIsCredentialsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually or rely on useEffect watching status
        email,
        password,
        callbackUrl: "/",
      });

      if (result?.error) {
        const errorMessage = result.error === "CredentialsSignin"
          ? "Invalid email or password. Please try again."
          : "Login failed. Please check your credentials or try another method.";
        setError(errorMessage);
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (result?.ok) {
        // signIn was successful, useEffect for status "authenticated" will redirect.
        // router.replace(result.url || "/"); // Or explicitly redirect
      } else {
        // Should not happen if no error and no ok
        setError("An unexpected issue occurred during login. Please try again.");
        toast({ title: "Login Error", description: "An unexpected issue occurred. Please try again.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Credentials Sign-In failed unexpectedly:", err);
      setError("An unexpected error occurred. Please try again.");
      toast({ title: "Login Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsCredentialsLoading(false);
    }
  };
  
  const anyLoading = isLoading || isGoogleLoading || isCredentialsLoading;

  if (status === "loading" && !anyLoading) { // Only show full page loader if not already loading from a button press
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }
  
  if (status === "authenticated") return null; // useEffect will redirect

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary rounded-full mb-4 mx-auto">
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
            onClick={handleGoogleSignIn}
            disabled={anyLoading}
            className="w-full text-base py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            aria-label="Sign in with Google"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Sign in with Google</span>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="1234567@stu.hus.ac.jp" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="pl-10"
                  disabled={anyLoading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pl-10"
                  disabled={anyLoading}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={anyLoading}
              className="w-full text-base py-6"
              aria-label="Sign in with Email and Password"
            >
              {isCredentialsLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Mail className="mr-2 h-5 w-5" />
              )}
              Sign in with Email
            </Button>
          </form>
          
          <p className="text-xs text-center text-muted-foreground px-4">
            Google Sign-In is restricted to <strong>@stu.hus.ac.jp</strong> addresses.
            By signing in, you agree to our imaginary Terms of Service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

