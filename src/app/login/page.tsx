
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Mail, KeyRound, LogIn, UserPlus, Settings } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    const nextAuthError = searchParams.get("error");
    const signupSuccess = searchParams.get("signupSuccess");

    if (signupSuccess) {
      toast({
        title: "登録成功",
        description: "アカウントが作成されました。ログインしてください。",
      });
      router.replace('/login', { scroll: false }); // クエリパラメータを削除
    }

    if (nextAuthError) {
      let errorMessage = "ログイン中に不明なエラーが発生しました。もう一度お試しください。";
      if (nextAuthError === "OAuthAccountNotLinked") {
        errorMessage = "このメールアドレスは別のアカウントにリンクされています。別のログイン方法をお試しください。";
      } else if (nextAuthError === "DomainMismatch") {
         errorMessage = "Googleでのサインインは、@stu.hus.ac.jp のメールアドレスに制限されています。大学のGoogleアカウントを使用してください。";
      } else if (nextAuthError === "CredentialsSignin") {
        errorMessage = "メールアドレスまたはパスワードが無効です。入力情報をご確認の上、再度お試しください。";
      }
      
      setError(errorMessage);
      toast({
        title: "ログインエラー",
        description: errorMessage,
        variant: "destructive",
      });
      router.replace('/login', { scroll: false }); 
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
      // Googleサインイン成功時のリダイレクト先を "/" (InitialRedirectPage) に変更
      const res = await signIn("google", { callbackUrl: "/", redirect: true });
      if (res?.error) {
          const errMessage = res.error === "Callback" ? "ログインがキャンセルされたか失敗しました。もう一度お試しください。" : "Googleログインに失敗しました。HUS大学のGoogleアカウント(@stu.hus.ac.jp)を使用してください。";
          setError(errMessage);
          toast({ title: "ログイン失敗", description: errMessage, variant: "destructive" });
          setIsGoogleLoading(false);
      }
    } catch (err) {
      console.error("Googleサインインが予期せず失敗しました:", err);
      setError("Googleサインイン中に予期せぬエラーが発生しました。もう一度お試しください。");
      toast({ title: "ログインエラー", description: "予期せぬエラーが発生しました。もう一度お試しください。", variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialsSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setIsCredentialsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false, // リダイレクトはuseEffectで処理
        email,
        password,
        callbackUrl: "/", // 成功時のリダイレクト先
      });

      if (result?.error) {
        const errorMessage = result.error === "CredentialsSignin"
          ? "メールアドレスまたはパスワードが無効です。再度お試しください。"
          : "ログインに失敗しました。認証情報を確認するか、別の方法をお試しください。";
        setError(errorMessage);
        toast({
          title: "ログイン失敗",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (result?.ok) {
        // 成功、useEffectがリダイレクトを処理します
        // router.replace("/"); // 明示的なリダイレクトはuseEffectに任せる
      } else {
        setError("ログイン中に予期せぬ問題が発生しました。もう一度お試しください。");
        toast({ title: "ログインエラー", description: "予期せぬ問題が発生しました。もう一度お試しください。", variant: "destructive" });
      }
    } catch (err) {
      console.error("認証情報サインインが予期せず失敗しました:", err);
      setError("予期せぬエラーが発生しました。もう一度お試しください。");
      toast({ title: "ログインエラー", description: "予期せぬエラーが発生しました。もう一度お試しください。", variant: "destructive" });
    } finally {
      setIsCredentialsLoading(false);
    }
  };
  
  const anyLoading = isGoogleLoading || isCredentialsLoading;

  if (status === "loading" && !anyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">セッションを読み込んでいます...</p>
      </div>
    );
  }
  
  if (status === "authenticated") return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary rounded-full mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline text-primary">HUS-scheduler</CardTitle>
          <CardDescription className="text-muted-foreground">
            サインインして大学生活を管理しましょう。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>ログイン失敗</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showLoginForm && (
            <div className="space-y-4">
               <Button
                onClick={() => setShowLoginForm(true)}
                disabled={anyLoading}
                className="w-full text-base py-6"
                aria-label="ログインフォームを開く"
              >
                <LogIn className="mr-2 h-5 w-5" />
                <span>ログイン</span>
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                disabled={anyLoading}
                variant="outline"
                className="w-full text-base py-6"
                aria-label="新規登録ページへ移動"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                <span>新規登録</span>
              </Button>
              <Button variant="link" asChild className="text-xs text-muted-foreground">
                <Link href="/dev-admin">
                  <Settings className="mr-1 h-3 w-3" />
                  開発者用管理ページ
                </Link>
              </Button>
            </div>
          )}
          
          {showLoginForm && (
            <>
              <Button
                onClick={handleGoogleSignIn}
                disabled={anyLoading}
                className="w-full text-base py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                aria-label="Googleでサインイン"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-2">Googleでサインイン</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    またはメールアドレスでサインイン
                  </span>
                </div>
              </div>

              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="例：s1234567@stu.hus.ac.jp" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="pl-10"
                      disabled={anyLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">パスワード</Label>
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
                  aria-label="メールアドレスとパスワードでサインイン"
                >
                  {isCredentialsLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                  )}
                  メールアドレスでサインイン
                </Button>
              </form>
              <Button variant="link" onClick={() => setShowLoginForm(false)} className="w-full">戻る</Button>
            </>
          )}
          
          <p className="text-xs text-center text-muted-foreground px-4">
            Googleでのサインインは <strong>@stu.hus.ac.jp</strong> のアドレスに制限されています。
            サインインすることにより、当社の架空の利用規約に同意したものとみなされます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
