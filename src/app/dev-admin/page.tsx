"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Database, ServerCrash, User as UserIcon, MoreVertical, Pencil, Archive, Trash2, Train, Bus, Footprints, Clock, School, Home, AlertTriangle, Workflow } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OnboardingData } from "@/types/next-auth";

// Represents a subset of the Prisma User model for display
interface DisplayUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
  isSetupComplete: boolean;
  archived: boolean;
  onboardingData?: OnboardingData | null;
}

// Helper to format commute plan for display
const formatCommutePlan = (onboardingData: OnboardingData | null | undefined): string => {
  const plan = onboardingData?.commutePlan;
  if (!plan?.primaryMode) {
    return "설정 안됨";
  }

  const { primaryMode, startPoint, transferMode } = plan;

  switch (primaryMode) {
    case 'jr':
      return `JR (${startPoint || '미지정'}) → 테이네 (${transferMode || '미지정'})`;
    case 'subway':
      return `지하철 (${startPoint || '미지정'}) → 미야노사와 (${transferMode || '미지정'})`;
    case 'bus':
      return `버스 (${startPoint === 'teine_station' ? '테이네역' : '미야노사와역'})`;
    case 'bicycle':
      return `자전거 (${startPoint || '주소 미지정'})`;
    case 'walk':
      return `도보 (${startPoint || '주소 미지정'})`;
    default:
      return "정보 없음";
  }
};


export default function DevAdminPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", onboardingData: "" });

  // --- NEW: State for Fixed Route Simulation ---
  const [toSchoolStation, setToSchoolStation] = useState("sapporo_station");
  const [toSchoolPeriod, setToSchoolPeriod] = useState("1"); // 1교시
  const [toSchoolDayType, setToSchoolDayType] = useState("weekday");
  const [isCalculatingToSchool, setIsCalculatingToSchool] = useState(false);
  const [toSchoolResult, setToSchoolResult] = useState<any>(null);
  const [toSchoolError, setToSchoolError] = useState<string | null>(null);

  const [fromSchoolStation, setFromSchoolStation] = useState("sapporo_station");
  const [isCalculatingFromSchool, setIsCalculatingFromSchool] = useState(false);
  const [fromSchoolResult, setFromSchoolResult] = useState<any[] | null>(null);
  const [fromSchoolError, setFromSchoolError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/get-temp-data");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "데이터의 취득에 실패했습니다.");
      }
      const data: DisplayUser[] = await response.json();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "불명확한 에러가 발생했습니다.";
      setError(message);
      toast({
        title: "에러",
        description: `데이터 취득 실패: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (user: DisplayUser) => {
    setSelectedUser(user);
    setEditFormData({ 
      name: user.name ?? '', 
      email: user.email ?? '',
      onboardingData: JSON.stringify(user.onboardingData ?? {}, null, 2)
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: DisplayUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    let parsedOnboardingData;
    try {
      parsedOnboardingData = editFormData.onboardingData.trim() === '' ? {} : JSON.parse(editFormData.onboardingData);
    } catch (err) {
      toast({ title: "JSON 에러", description: "온보딩 정보가 유효한 JSON 형식이 아닙니다.", variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: editFormData.name, 
          email: editFormData.email,
          onboardingData: parsedOnboardingData
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user.');
      }
      const updatedUser: DisplayUser = await response.json();
      // After successful update, refetch all data to ensure consistency
      await fetchData();
      toast({ title: "성공", description: "유저 정보가 갱신되었습니다." });
      setIsEditDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "에러", description: `갱신 실패: ${message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async (user: DisplayUser) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !user.archived }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update archive status.');
      }
      const updatedUser: DisplayUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? {...u, ...updatedUser} : u));
      toast({ title: "성공", description: `유저를 ${updatedUser.archived ? '보관' : '보관 해제'}했습니다.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "에러", description: `상태 변경 실패: ${message}`, variant: 'destructive' });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user.');
      }
      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast({ title: "성공", description: "유저를 삭제했습니다." });
      setIsDeleteDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "에러", description: `삭제 실패: ${message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculateToSchool = async () => {
    setIsCalculatingToSchool(true);
    setToSchoolError(null);
    setToSchoolResult(null);

    const periodTimes: { [key: string]: string } = {
      '1': "09:00", '2': "10:30", '3': "13:00",
      '4': "14:40", '5': "16:20",
    };

    try {
      const response = await fetch('/api/calculate-fixed-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'to_school',
          originStation: toSchoolStation,
          arrivalDeadlineStr: periodTimes[toSchoolPeriod],
          dayType: toSchoolDayType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '고정 경로 계산에 실패했습니다.');
      }
      setToSchoolResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setToSchoolError(message);
      toast({ title: "등교 경로 계산 에러", description: message, variant: 'destructive' });
    } finally {
      setIsCalculatingToSchool(false);
    }
  };

  const handleCalculateFromSchool = async () => {
    setIsCalculatingFromSchool(true);
    setFromSchoolError(null);
    setFromSchoolResult(null);

    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 6 = Saturday
    const currentDayType = (day === 0 || day === 6) ? 'weekend' : 'weekday';

    try {
      const response = await fetch('/api/calculate-fixed-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'from_school',
          destinationStation: fromSchoolStation,
          dayType: currentDayType,
        }),
      });
      const data = await response.json();
       if (!response.ok) {
        throw new Error(data.message || '고정 경로 계산에 실패했습니다.');
      }
      setFromSchoolResult(data);
    } catch (err) {
       const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
       setFromSchoolError(message);
       toast({ title: "귀가 경로 계산 에러", description: message, variant: 'destructive' });
    } finally {
      setIsCalculatingFromSchool(false);
    }
  };

  const StepIcon = ({ type }: { type: string }) => {
    if (type === 'TRAIN') return <Train className="h-5 w-5 text-primary" />;
    if (type === 'BUS') return <Bus className="h-5 w-5 text-primary" />;
    if (type === 'WALK') return <Footprints className="h-5 w-5 text-primary" />;
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Database className="mr-3 h-8 w-8" />
          개발자 관리 페이지
        </h1>
        <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard/admin/db-viewer">DB 뷰어</Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href="/login">로그인 페이지로 돌아가기</Link>
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <School className="mr-3 h-6 w-6" />
              등교 시뮬레이션 (고정 경로)
            </CardTitle>
            <CardDescription>
              내부 시간표(timetable.json) 기반으로 최신 출발 시간을 계산합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="to-school-station">출발역</Label>
                <Select value={toSchoolStation} onValueChange={setToSchoolStation}>
                  <SelectTrigger id="to-school-station"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sapporo_station">札幌駅</SelectItem></SelectContent>
                </Select>
              </div>
               <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="to-school-period">목표 교시</Label>
                <Select value={toSchoolPeriod} onValueChange={setToSchoolPeriod}>
                  <SelectTrigger id="to-school-period"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1교시 (09:00)</SelectItem>
                    <SelectItem value="2">2교시 (10:30)</SelectItem>
                    <SelectItem value="3">3교시 (13:00)</SelectItem>
                    <SelectItem value="4">4교시 (14:40)</SelectItem>
                    <SelectItem value="5">5교시 (16:20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="to-school-daytype">요일</Label>
                 <Select value={toSchoolDayType} onValueChange={setToSchoolDayType}>
                  <SelectTrigger id="to-school-daytype"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">평일</SelectItem>
                    <SelectItem value="weekend">주말/공휴일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCalculateToSchool} disabled={isCalculatingToSchool} className="w-full">
              {isCalculatingToSchool ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              최신 출발 시간 계산
            </Button>
             {toSchoolError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{toSchoolError}</AlertDescription></Alert>}
             {toSchoolResult && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">권장 출발 시각</p>
                        <p className="text-2xl font-bold text-primary">{toSchoolResult.recommendedDepartureTime}</p>
                        <p className="text-sm text-muted-foreground">예상 도착: {toSchoolResult.finalArrivalTime}</p>
                    </div>
                    <div className="space-y-2">
                        {toSchoolResult.steps.map((step: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-2 rounded-md bg-background">
                                <StepIcon type={step.type} />
                                <div className="flex-1">
                                    <p className="font-semibold">{step.type === 'WALK' ? '도보 이동' : `${step.line} ${step.type}`}</p>
                                    <p className="text-sm">{step.from} → {step.to}</p>
                                    {step.departureTime && <p className="text-xs text-muted-foreground">{step.departureTime} - {step.arrivalTime} ({step.duration}분)</p>}
                                    {step.realtime_info && <p className={cn("text-xs", step.realtime_info.delay_minutes > 0 ? "text-destructive" : "text-green-600")}>({step.realtime_info.status})</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <Home className="mr-3 h-6 w-6" />
              귀가 시뮬레이션 (고정 경로)
            </CardTitle>
            <CardDescription>
              현재 시각 이후의 출발 경로 3개를 timetable.json에서 조회합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="from-school-station">도착역</Label>
              <Select value={fromSchoolStation} onValueChange={setFromSchoolStation}>
                  <SelectTrigger id="from-school-station"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sapporo_station">札幌駅</SelectItem></SelectContent>
                </Select>
            </div>
            <Button onClick={handleCalculateFromSchool} disabled={isCalculatingFromSchool} className="w-full">
               {isCalculatingFromSchool ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              다음 출발편 조회
            </Button>
             {fromSchoolError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{fromSchoolError}</AlertDescription></Alert>}
             {fromSchoolResult && (
                <Accordion type="single" collapsible className="w-full">
                    {fromSchoolResult.map((route, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>출발: {route.departureFromSchoolTime}</span>
                                    <span>도착: {route.finalArrivalTime}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2">
                                    {route.steps.map((step: any, stepIndex: number) => (
                                        <div key={stepIndex} className="flex items-start space-x-3 p-2 rounded-md bg-background">
                                            <StepIcon type={step.type} />
                                            <div className="flex-1">
                                                <p className="font-semibold">{step.type === 'WALK' ? '도보 이동' : `${step.line} ${step.type}`}</p>
                                                <p className="text-sm">{step.from} → {step.to}</p>
                                                {step.departureTime && <p className="text-xs text-muted-foreground">{step.departureTime} - {step.arrivalTime} ({step.duration}분)</p>}
                                                {step.realtime_info && <p className={cn("text-xs", step.realtime_info.delay_minutes > 0 ? "text-destructive" : "text-green-600")}>({step.realtime_info.status})</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4 mt-8">
        <p className="text-muted-foreground">
          데이터베이스에서 직접 가져온 현재 사용자 데이터입니다.
        </p>
        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-80 text-destructive">
            <ServerCrash className="h-12 w-12" />
            <p className="mt-4 font-semibold">데이터 로딩 실패</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <Table>
            <TableCaption>
              {users.length > 0 ? `${users.length}명의 유저를 찾았습니다.` : "데이터베이스에 유저가 없습니다."}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">유저</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>통학 정보</TableHead>
                <TableHead className="text-center">온보딩 완료</TableHead>
                <TableHead className="w-[200px]">유저 ID</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-archived={user.archived} className="data-[archived=true]:bg-muted/50 data-[archived=true]:text-muted-foreground">
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.name ?? "N/A"}
                    {user.archived && <Badge variant="secondary" className="ml-2">보관됨</Badge>}
                  </TableCell>
                  <TableCell>{user.email ?? "N/A"}</TableCell>
                  <TableCell className="text-xs">{formatCommutePlan(user.onboardingData)}</TableCell>
                  <TableCell className="text-center">
                    {user.isSetupComplete ? (
                      <Badge variant="default">예</Badge>
                    ) : (
                      <Badge variant="destructive">아니요</Badge>
                    )}
                  </TableCell>
                   <TableCell className="font-mono text-xs">{user.id}</TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuLabel>작업</DropdownMenuLabel>
                         <DropdownMenuItem onClick={() => handleEditClick(user)}>
                           <Pencil className="mr-2 h-4 w-4" />
                           유저 수정
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleArchiveToggle(user)}>
                           <Archive className="mr-2 h-4 w-4" />
                           {user.archived ? '보관 해제' : '보관'}
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem
                           className="text-destructive focus:text-destructive"
                           onClick={() => handleDeleteClick(user)}
                         >
                           <Trash2 className="mr-2 h-4 w-4" />
                           유저 삭제
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>유저 편집</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} 의 프로필 정보를 변경합니다. 저장 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                이메일
              </Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="onboardingData" className="text-right pt-2">
                온보딩 정보 (JSON)
              </Label>
              <Textarea
                id="onboardingData"
                value={editFormData.onboardingData}
                onChange={(e) => setEditFormData({ ...editFormData, onboardingData: e.target.value })}
                className="col-span-3 h-48 font-mono text-xs"
                placeholder="{...}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              변경 사항 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 유저 '{selectedUser?.name}'을(를) 영구적으로 삭제합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>취소</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              삭제
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
