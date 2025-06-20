"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Settings2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function OnboardingPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { isOnboarded, setOnboardedStatus, isLoading: isOnboardingLoading } = useOnboardingStatus();
  
  const [department, setDepartment] = useState("");
  const [homeStation, setHomeStation] = useState("");
  const [universityStation, setUniversityStation] = useState("");
  const [syncMoodle, setSyncMoodle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientRendered, setIsClientRendered] = useState(false);

  useEffect(() => {
    setIsClientRendered(true);
  }, []);

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
    // In a real app, you'd save this data to your backend (e.g., Firestore)
    // For now, we'll simulate a save and update localStorage.
    console.log("Onboarding data:", { department, homeStation, universityStation, syncMoodle });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Example: Store a simplified version or just the fact that onboarding is complete
    // Real preferences would be stored server-side, linked to the user ID.
    try {
      localStorage.setItem('user_department', department);
      localStorage.setItem('user_home_station', homeStation);
      localStorage.setItem('user_university_station', universityStation);
      localStorage.setItem('user_sync_moodle', String(syncMoodle));
      setOnboardedStatus(true);
      toast({
        title: "Preferences Saved!",
        description: "Welcome to HUS-scheduler!",
      });
      router.replace("/dashboard");
    } catch (error) {
       toast({
        title: "Error",
        description: "Could not save preferences. Please try again.",
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
        <p className="text-muted-foreground">Loading onboarding...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    // This case should be handled by the redirect effect, but as a fallback:
    return null; 
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4 py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Settings2 size={32} />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Welcome to HUS-scheduler!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Let's set up your preferences to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="department" className="font-medium">Department</Label>
              <Select value={department} onValueChange={setDepartment} required>
                <SelectTrigger id="department" aria-label="Select your department">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="ee">Electrical Engineering</SelectItem>
                  <SelectItem value="me">Mechanical Engineering</SelectItem>
                  <SelectItem value="bio">Biology</SelectItem>
                  <SelectItem value="chem">Chemistry</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="homeStation" className="font-medium">Home Station</Label>
              <Input 
                id="homeStation" 
                placeholder="e.g., Shinjuku Station" 
                value={homeStation} 
                onChange={(e) => setHomeStation(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="universityStation" className="font-medium">University Station</Label>
              <Input 
                id="universityStation" 
                placeholder="e.g., Hongo-sanchome Station" 
                value={universityStation} 
                onChange={(e) => setUniversityStation(e.target.value)} 
                required 
              />
            </div>
            
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="syncMoodle" className="text-base font-medium">Sync Moodle Data</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically import assignments and deadlines from Moodle.
                </p>
              </div>
              <Switch 
                id="syncMoodle" 
                checked={syncMoodle} 
                onCheckedChange={setSyncMoodle}
                aria-label="Sync Moodle Data"
              />
            </div>
            <CardFooter className="p-0 pt-4">
              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" /> 
                )}
                Save Preferences & Continue
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
