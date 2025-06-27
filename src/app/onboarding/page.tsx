
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FloatingActionButtons } from "@/components/layout/floating-action-buttons";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";

export default function OnboardingPage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { isOnboarded, isLoading: isOnboardingLoading } = useOnboardingStatus();
  
  const [department, setDepartment] = useState(session?.user?.onboardingData?.department || "");
  const [homeStation, setHomeStation] = useState(session?.user?.onboardingData?.homeStation || "");
  const [universityStation, setUniversityStation] = useState(session?.user?.onboardingData?.universityStation || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  useEffect(() => {
    if (session?.user?.onboardingData) {
      const { department, homeStation, universityStation } = session.user.onboardingData;
      if (department) setDepartment(department);
      if (homeStation) setHomeStation(homeStation);
      if (universityStation) setUniversityStation(universityStation);
    }
  }, [session]);


  useEffect(() => {
    if (!isClientRendered || authStatus === "loading" || isOnboardingLoading) return;

    if (authStatus === "unauthenticated") {
      router.replace("/login");
    } else if (authStatus === "authenticated" && isOnboarded) {
      router.replace("/dashboard");
    }
  }, [isClientRendered, authStatus, isOnboarded, isOnboardingLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const onboardingPayload = { department, homeStation, universityStation };

    try {
      const response = await fetch('/api/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "オンボーディング情報の更新に失敗しました。");
      }
      
      // The session will be updated on the next page load or via the JWT callback automatically.
      // For immediate reflection, we can call update()
      await updateSession();

      toast({
        title: "設定を保存しました！",
        description: "HUS-schedulerへようこそ！",
      });
      router.replace("/dashboard");
    } catch (error) {
       const message = error instanceof Error ? error.message : "設定を保存できませんでした。";
       toast({
        title: "エラー",
        description: `${message} もう一度お試しください。`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClientRendered || authStatus === "loading" || isOnboardingLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">オンボーディングを読み込んでいます...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || (authStatus === "authenticated" && isOnboarded && !isSubmitting) ) {
     return null; 
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Settings2 size={32} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">HUS-schedulerへようこそ！</CardTitle>
          <CardDescription className="text-muted-foreground">
            よりパーソナルな体験のために、あなたの設定を行いましょう。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="department" className="font-medium">学部・学科</Label>
              <Select value={department} onValueChange={setDepartment} required>
                <SelectTrigger id="department" aria-label="学部・学科を選択してください">
                  <SelectValue placeholder="学部・学科を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">情報科学部</SelectItem>
                  <SelectItem value="ee">工学部 電気電子工学科</SelectItem>
                  <SelectItem value="me">工学部 機械工学科</SelectItem>
                  <SelectItem value="bio">保健医療学部</SelectItem>
                  <SelectItem value="chem">薬学部</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeStation" className="font-medium">最寄駅</Label>
              <Input 
                id="homeStation" 
                placeholder="例：手稲駅" 
                value={homeStation} 
                onChange={(e) => setHomeStation(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityStation" className="font-medium">大学の最寄駅</Label>
              <Input 
                id="universityStation" 
                placeholder="例：手稲駅" 
                value={universityStation} 
                onChange={(e) => setUniversityStation(e.target.value)} 
                required 
              />
            </div>
            
            <CardFooter className="p-0 pt-4">
              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" /> 
                )}
                設定を保存して続ける
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      <div className="mt-8">
         <FloatingActionButtons />
      </div>
    </div>
  );
}
