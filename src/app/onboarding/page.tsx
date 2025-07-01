
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, Settings2, Save, TrainFront, TramFront, Bus, Bike, Footprints, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FloatingActionButtons } from "@/components/layout/floating-action-buttons";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";
import { cn } from "@/lib/utils";

const jrStations = [
  { value: "sapporo", label: "札幌 (さっぽろ)" },
  { value: "kotoni", label: "琴似 (ことに)" },
  { value: "teine", label: "手稲 (ていね)" },
  { value: "otaru", label: "小樽 (おたる)" },
  { value: "chitose", label: "千歳 (ちとせ)" },
];

const subwayStations = [
  { value: "sapporo", label: "さっぽろ" },
  { value: "odori", label: "大通 (おおどおり)" },
  { value: "miyanosawa", label: "宮の沢 (みやのさわ)" },
  { value: "makomanai", label: "真駒内 (まこまない)" },
  { value: "asabu", label: "麻生 (あさぶ)" },
];

const Combobox = ({ stations, value, onValueChange, placeholder }: { stations: {value: string, label: string}[], value: string, onValueChange: (value: string) => void, placeholder: string }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = stations.find((s) => s.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? selectedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="駅を検索..." />
          <CommandList>
            <CommandEmpty>駅が見つかりません。</CommandEmpty>
            <CommandGroup>
              {stations.map((station) => (
                <CommandItem
                  key={station.value}
                  value={station.label} // Search by label
                  onSelect={() => {
                    onValueChange(station.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === station.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {station.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


export default function OnboardingPage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { isOnboarded, isLoading: isOnboardingLoading } = useOnboardingStatus();
  
  const [department, setDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientRendered, setIsClientRendered] = useState(false);

  // New state for detailed commute plan
  const [primaryMode, setPrimaryMode] = useState<string>("");
  const [jrStation, setJrStation] = useState("");
  const [transferFromTeine, setTransferFromTeine] = useState("");
  const [subwayStation, setSubwayStation] = useState("");
  const [transferFromMiyanosawa, setTransferFromMiyanosawa] = useState("");
  const [busStartPoint, setBusStartPoint] = useState("");
  const [walkOrBikeAddress, setWalkOrBikeAddress] = useState("");

  useEffect(() => {
    setIsClientRendered(true);
  }, []);

  useEffect(() => {
    if (session?.user?.onboardingData) {
      const { department, commutePlan } = session.user.onboardingData;
      if (department) setDepartment(department);
      if (commutePlan) {
        setPrimaryMode(commutePlan.primaryMode || "");
        if (commutePlan.primaryMode === 'jr') {
          setJrStation(commutePlan.startPoint || "");
          setTransferFromTeine(commutePlan.transferMode || "");
        } else if (commutePlan.primaryMode === 'subway') {
          setSubwayStation(commutePlan.startPoint || "");
          setTransferFromMiyanosawa(commutePlan.transferMode || "");
        } else if (commutePlan.primaryMode === 'bus') {
          setBusStartPoint(commutePlan.startPoint || "");
        } else if (commutePlan.primaryMode === 'bicycle' || commutePlan.primaryMode === 'walk') {
          setWalkOrBikeAddress(commutePlan.startPoint || "");
        }
      }
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
    
    let commutePlan: any = { primaryMode };
    if (primaryMode === 'jr') {
      commutePlan.startPoint = jrStation;
      commutePlan.transferMode = transferFromTeine;
    } else if (primaryMode === 'subway') {
      commutePlan.startPoint = subwayStation;
      commutePlan.transferMode = transferFromMiyanosawa;
    } else if (primaryMode === 'bus') {
      commutePlan.startPoint = busStartPoint;
    } else if (primaryMode === 'bicycle' || primaryMode === 'walk') {
      commutePlan.startPoint = walkOrBikeAddress;
    }

    const onboardingPayload = { department, commutePlan };

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
              <Label className="font-medium">주요 통학 수단</Label>
              <RadioGroup value={primaryMode} onValueChange={setPrimaryMode} className="grid grid-cols-3 gap-2">
                {[
                  { value: 'jr', label: 'JR', icon: TrainFront },
                  { value: 'subway', label: '地下鉄', icon: TramFront },
                  { value: 'bus', label: 'バス', icon: Bus },
                  { value: 'bicycle', label: '自転車', icon: Bike },
                  { value: 'walk', label: '徒歩', icon: Footprints },
                ].map(({ value, label, icon: Icon }) => (
                  <Label key={value} htmlFor={`mode-${value}`} className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value={value} id={`mode-${value}`} className="sr-only" />
                    <Icon className="mb-2 h-6 w-6" />
                    {label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {primaryMode === 'jr' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="jr-station" className="font-medium">출발하는 JR역</Label>
                  <Combobox stations={jrStations} value={jrStation} onValueChange={setJrStation} placeholder="JR역 선택..." />
                </div>
                {jrStation && (
                  <div className="space-y-2">
                    <Label className="font-medium">테이네역에서 학교까지</Label>
                    <RadioGroup value={transferFromTeine} onValueChange={setTransferFromTeine} className="flex gap-4">
                      <Label htmlFor="teine-bus" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="bus" id="teine-bus" /><span>バス</span></Label>
                      <Label htmlFor="teine-walk" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="walk" id="teine-walk" /><span>徒歩</span></Label>
                      <Label htmlFor="teine-bike" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="bicycle" id="teine-bike" /><span>自転車</span></Label>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
            
            {primaryMode === 'subway' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="subway-station" className="font-medium">출발하는 지하철역</Label>
                  <Combobox stations={subwayStations} value={subwayStation} onValueChange={setSubwayStation} placeholder="지하철역 선택..." />
                </div>
                 {subwayStation && (
                  <div className="space-y-2">
                    <Label className="font-medium">미야노사와역에서 학교까지</Label>
                     <RadioGroup value={transferFromMiyanosawa} onValueChange={setTransferFromMiyanosawa} className="flex gap-4">
                      <Label htmlFor="miyano-bus" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="bus" id="miyano-bus" /><span>バス</span></Label>
                      <Label htmlFor="miyano-walk" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="walk" id="miyano-walk" /><span>徒歩</span></Label>
                      <Label htmlFor="miyano-bike" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="bicycle" id="miyano-bike" /><span>自転車</span></Label>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {primaryMode === 'bus' && (
               <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                 <div className="space-y-2">
                    <Label className="font-medium">출발하는 버스 정류장</Label>
                     <RadioGroup value={busStartPoint} onValueChange={setBusStartPoint} className="flex gap-4">
                      <Label htmlFor="bus-teine" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="teine_station" id="bus-teine" /><span>테이네역 남쪽 출구</span></Label>
                      <Label htmlFor="bus-miyano" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="miyanosawa_station" id="bus-miyano" /><span>미야노사와역</span></Label>
                    </RadioGroup>
                  </div>
               </div>
            )}

             {['bicycle', 'walk'].includes(primaryMode) && (
               <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                 <div className="space-y-2">
                  <Label htmlFor="address" className="font-medium">출발지 주소 또는 우편번호</Label>
                  <Input 
                    id="address" 
                    placeholder="예: 札幌市手稲区前田..." 
                    value={walkOrBikeAddress} 
                    onChange={(e) => setWalkOrBikeAddress(e.target.value)} 
                    required 
                  />
                </div>
               </div>
            )}
            
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
