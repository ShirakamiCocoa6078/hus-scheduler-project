
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Database, ServerCrash, User as UserIcon, MoreVertical, Pencil, Archive, Trash2, TrainFront, AlertTriangle, Clock, Calendar as CalendarIcon, School, Home } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


// Represents a subset of the Prisma User model for display
interface DisplayUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
  isSetupComplete: boolean;
  archived: boolean;
}

export default function DevAdminPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", email: "" });

  // State for "To School" (등교) simulation
  const [toSchoolOrigin, setToSchoolOrigin] = useState("札幌駅");
  const [toSchoolDate, setToSchoolDate] = useState<Date | undefined>(new Date());
  const [toSchoolPeriod, setToSchoolPeriod] = useState("1"); // 1교시
  const [isCalculatingToSchool, setIsCalculatingToSchool] = useState(false);
  const [toSchoolError, setToSchoolError] = useState<string | null>(null);
  const [toSchoolResponse, setToSchoolResponse] = useState<any | null>(null);

  // State for "From School" (귀가) simulation
  const [fromSchoolDest, setFromSchoolDest] = useState("札幌駅");
  const [isCalculatingFromSchool, setIsCalculatingFromSchool] = useState(false);
  const [fromSchoolError, setFromSchoolError] = useState<string | null>(null);
  const [fromSchoolResponse, setFromSchoolResponse] = useState<any | null>(null);
  
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

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
    setEditFormData({ name: user.name ?? '', email: user.email ?? '' });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: DisplayUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFormData.name, email: editFormData.email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user.');
      }
      const updatedUser: DisplayUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? {...u, ...updatedUser} : u));
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
    setToSchoolResponse(null);

    if (!toSchoolDate) {
      const msg = "날짜를 선택해주세요.";
      setToSchoolError(msg);
      toast({ title: "에러", description: msg, variant: "destructive" });
      setIsCalculatingToSchool(false);
      return;
    }

    const periodTimes: { [key: string]: { hour: number; minute: number } } = {
      '1': { hour: 9, minute: 0 },
      '2': { hour: 10, minute: 30 },
      '3': { hour: 13, minute: 0 },
      '4': { hour: 14, minute: 40 },
      '5': { hour: 16, minute: 20 },
    };
    const { hour, minute } = periodTimes[toSchoolPeriod as keyof typeof periodTimes];
    
    const arrivalDeadline = new Date(toSchoolDate);
    arrivalDeadline.setHours(hour, minute, 0, 0);

    try {
      const response = await fetch('/api/dev/transit-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: toSchoolOrigin,
          arrivalTime: arrivalDeadline.toISOString(),
        }),
      });
      const data = await response.json();

      if (data.debugLogs && Array.isArray(data.debugLogs)) {
        console.groupCollapsed("Server-side logs for 등교 시뮬레이션 (클릭하여 확장)");
        data.debugLogs.forEach((log: string) => console.log(log));
        console.groupEnd();
      }

      if (!response.ok) {
        throw new Error(data.message || '경로 계산에 실패했습니다.');
      }
      setToSchoolResponse(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setToSchoolError(message);
      toast({ title: "경로 탐색 API 에러", description: message, variant: 'destructive' });
    } finally {
      setIsCalculatingToSchool(false);
    }
  };
  
  const handleCalculateFromSchool = async () => {
    setIsCalculatingFromSchool(true);
    setFromSchoolError(null);
    setFromSchoolResponse(null);
    try {
      const response = await fetch('/api/dev/transit-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: fromSchoolDest,
          departureTime: 'now',
        }),
      });
      const data = await response.json();

      if (data.debugLogs && Array.isArray(data.debugLogs)) {
        console.groupCollapsed("Server-side logs for 귀가 시뮬레이션 (클릭하여 확장)");
        data.debugLogs.forEach((log: string) => console.log(log));
        console.groupEnd();
      }

      if (!response.ok) {
        throw new Error(data.message || '경로 계산에 실패했습니다.');
      }
      setFromSchoolResponse(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setFromSchoolError(message);
      toast({ title: "경로 탐색 API 에러", description: message, variant: 'destructive' });
    } finally {
      setIsCalculatingFromSchool(false);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Database className="mr-3 h-8 w-8" />
          개발자 관리 페이지
        </h1>
        <Button variant="outline" asChild>
          <Link href="/login">로그인 페이지로 돌아가기</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
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
                <TableHead className="text-center">온보딩 완료</TableHead>
                <TableHead className="w-[280px]">유저 ID</TableHead>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <School className="mr-3 h-6 w-6" />
              등교 시뮬레이션 (도착 시간 기준)
            </CardTitle>
            <CardDescription>
              특정 교시까지 학교에 도착하기 위한 최신 출발 시간을 계산합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to-school-origin">출발지</Label>
              <Input 
                id="to-school-origin"
                value={toSchoolOrigin}
                onChange={(e) => setToSchoolOrigin(e.target.value)}
                placeholder="예: 札幌駅"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to-school-date">목표 날짜</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !toSchoolDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toSchoolDate ? format(toSchoolDate, "PPP") : <span>날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toSchoolDate}
                      onSelect={setToSchoolDate}
                      initialFocus
                      fromDate={new Date()}
                      toDate={threeMonthsFromNow}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-school-period">목표 교시</Label>
                <Select value={toSchoolPeriod} onValueChange={setToSchoolPeriod}>
                  <SelectTrigger id="to-school-period">
                    <SelectValue placeholder="교시 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1교시 (09:00)</SelectItem>
                    <SelectItem value="2">2교시 (10:30)</SelectItem>
                    <SelectItem value="3">3교시 (13:00)</SelectItem>
                    <SelectItem value="4">4교시 (14:40)</SelectItem>
                    <SelectItem value="5">5교시 (16:20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCalculateToSchool} disabled={isCalculatingToSchool} className="w-full">
              {isCalculatingToSchool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              최신 출발 시간 계산
            </Button>
            {toSchoolError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>에러</AlertTitle>
                <AlertDescription>{toSchoolError}</AlertDescription>
              </Alert>
            )}
            {toSchoolResponse && (
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="formatted">
                  <AccordionTrigger>포맷된 경로 결과</AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto text-white">
                      <code>{JSON.stringify(toSchoolResponse.formattedRoute, null, 2)}</code>
                    </pre>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="raw">
                  <AccordionTrigger>원본 Google Maps API 응답</AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto text-white">
                      <code>{JSON.stringify(toSchoolResponse.rawResponse, null, 2)}</code>
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary flex items-center">
              <Home className="mr-3 h-6 w-6" />
              귀가 시뮬레이션 (현재 출발 기준)
            </CardTitle>
            <CardDescription>
              현재 시각에 학교에서 출발하는 가장 빠른 경로를 계산합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-school-dest">도착지</Label>
              <Input 
                id="from-school-dest"
                value={fromSchoolDest}
                onChange={(e) => setFromSchoolDest(e.target.value)}
                placeholder="예: 札幌駅"
              />
            </div>
            <Button onClick={handleCalculateFromSchool} disabled={isCalculatingFromSchool} className="w-full">
              {isCalculatingFromSchool && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              현재 시간으로 경로 계산
            </Button>
            {fromSchoolError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>에러</AlertTitle>
                <AlertDescription>{fromSchoolError}</AlertDescription>
              </Alert>
            )}
            {fromSchoolResponse && (
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="formatted-arrival">
                  <AccordionTrigger>포맷된 경로 결과</AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto text-white">
                      <code>{JSON.stringify(fromSchoolResponse.formattedRoute, null, 2)}</code>
                    </pre>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="raw-arrival">
                  <AccordionTrigger>원본 Google Maps API 응답</AccordionTrigger>
                  <AccordionContent>
                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto text-white">
                      <code>{JSON.stringify(fromSchoolResponse.rawResponse, null, 2)}</code>
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 유저 '{selectedUser?.name}'을(를) 영구적으로 삭제합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSubmitting(false)} disabled={isSubmitting}>취소</AlertDialogCancel>
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
