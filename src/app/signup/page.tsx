
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.001-0.001l6.19,5.238C39.99,36.088,44,30.617,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/"); // Redirect to dashboard or onboarding if already logged in
    }
  }, [session, status, router]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Using signIn for Google, as NextAuth handles both sign-in and sign-up via the same flow for OAuth providers
      const res = await signIn("google", { callbackUrl: "/", redirect: true });
      if (res?.error) {
        const errMessage = res.error === "Callback" 
          ? "新規登録がキャンセルされたか失敗しました。もう一度お試しください。" 
          : "Googleでの新規登録中にエラーが発生しました。";
        toast({ title: "登録失敗", description: errMessage, variant: "destructive" });
        setIsGoogleLoading(false);
      }
      // On successful redirect, this part might not be reached.
    } catch (err) {
      console.error("Googleサインアップが予期せず失敗しました:", err);
      toast({ title: "登録エラー", description: "予期せぬエラーが発生しました。もう一度お試しください。", variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">読み込んでいます...</p>
      </div>
    );
  }

  if (status === "authenticated") return null; // useEffect will redirect

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary rounded-full mb-4 mx-auto">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">アカウント作成</CardTitle>
          <CardDescription className="text-muted-foreground">
            HUSスケジューラーへようこそ！大学のGoogleアカウントで簡単に始められます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full text-base py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            aria-label="Googleで新規登録"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Googleで新規登録</span>
          </Button>
          
          <p className="text-xs text-center text-muted-foreground px-4">
            Googleでの登録は <strong>@stu.hus.ac.jp</strong> のアドレスに制限されています。
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            すでにアカウントをお持ちですか？
          </p>
          <Button variant="link" asChild className="text-primary">
            <Link href="/login">ログインはこちら</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
