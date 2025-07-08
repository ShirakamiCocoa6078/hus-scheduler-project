// /app/dashboard/admin/db-viewer/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Edit, Trash2, PlusCircle, ServerCrash } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type User = {
    id: string;
    name: string | null;
    email: string | null;
}
type Course = {
    id: string;
    userId: string;
    courseName: string;
    dayOfWeek: number;
    period: number;
    location: string | null;
    startTime: string;
    endTime: string;
}
type Task = {
    id: string;
    userId: string;
    courseId: string;
    type: 'ASSIGNMENT' | 'EXAM';
    title: string;
    dueDate: string;
    isCompleted: boolean;
    location: string | null;
    period: number | null;
    course: { courseName: string };
}
type UserData = {
    courses: Course[];
    tasks: Task[];
}

const dayOfWeekMap: { [key: number]: string } = { 0: '日', 1: '月', 2: '火', 3: '水', 4: '木', 5: '金', 6: '土' };
const periodTimes: { [key: number]: string } = {1: '09:00', 2: '10:40', 3: '13:00', 4: '14:40', 5: '16:20', 6: '18:00'};

export default function DbViewerPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // --- Modal State ---
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ type: 'course' | 'task', id: string } | null>(null);

    // --- Data Fetching ---
    const fetchUsers = async () => {
        setIsUsersLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error("ユーザーリストの取得に失敗しました。");
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラーです。");
        } finally {
            setIsUsersLoading(false);
        }
    };

    const fetchUserData = async (userId: string) => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        setUserData(null);
        try {
            const res = await fetch(`/api/admin/all-data?userId=${userId}`);
            if (!res.ok) throw new Error("ユーザーデータの取得に失敗しました。");
            const data = await res.json();
            setUserData(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "不明なエラーです。");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
        fetchUserData(userId);
    };

    // --- CRUD Handlers ---
    const handleSaveCourse = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUserId) return;
        const formData = new FormData(e.currentTarget);
        const data = {
            courseName: formData.get('courseName') as string,
            dayOfWeek: parseInt(formData.get('dayOfWeek') as string),
            period: parseInt(formData.get('period') as string),
            location: formData.get('location') as string,
            startTime: periodTimes[parseInt(formData.get('period') as string)] || "N/A",
            endTime: "N/A", // This can be improved
            userId: selectedUserId,
        };

        const url = editingCourse ? `/api/admin/courses/${editingCourse.id}` : '/api/admin/courses';
        const method = editingCourse ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error("コースの保存に失敗しました。");
            toast({ title: "成功", description: "コースが保存されました。" });
            setIsCourseModalOpen(false);
            setEditingCourse(null);
            fetchUserData(selectedUserId);
        } catch (err) {
            toast({ title: "エラー", description: err instanceof Error ? err.message : "不明なエラー", variant: "destructive" });
        }
    };

    const handleSaveTask = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUserId) return;
        const formData = new FormData(e.currentTarget);
        const data = {
            title: formData.get('title') as string,
            courseId: formData.get('courseId') as string,
            dueDate: new Date(formData.get('dueDate') as string).toISOString(),
            type: formData.get('type') as 'ASSIGNMENT' | 'EXAM',
            isCompleted: (formData.get('isCompleted') as string) === 'on',
            userId: selectedUserId,
        };
        
        const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
        const method = editingTask ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error("タスクの保存に失敗しました。");
            toast({ title: "成功", description: "タスクが保存されました。" });
            setIsTaskModalOpen(false);
            setEditingTask(null);
            fetchUserData(selectedUserId);
        } catch (err) {
            toast({ title: "エラー", description: err instanceof Error ? err.message : "不明なエラー", variant: "destructive" });
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !selectedUserId) return;
        const { type, id } = itemToDelete;
        try {
            const res = await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("削除に失敗しました。");
            toast({ title: "成功", description: "項目が削除されました。" });
            setItemToDelete(null);
            fetchUserData(selectedUserId);
        } catch (err) {
             toast({ title: "エラー", description: err instanceof Error ? err.message : "不明なエラー", variant: "destructive" });
        }
    };
    
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-headline">DB管理ビューア</h1>
                <div className="flex gap-2">
                    <Button onClick={() => selectedUserId && fetchUserData(selectedUserId)} disabled={isLoading || !selectedUserId} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> 更新
                    </Button>
                    <Button asChild><Link href="/dev-admin">管理ページに戻る</Link></Button>
                </div>
            </div>

            {isUsersLoading ? (
                <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : error && !users.length ? (
                <Alert variant="destructive"><ServerCrash className="h-4 w-4" /><AlertTitle>致命的なエラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
            ) : (
                <Select onValueChange={handleUserChange} disabled={!users.length}>
                    <SelectTrigger><SelectValue placeholder="管理するユーザーを選択してください" /></SelectTrigger>
                    <SelectContent>
                        {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="mt-6">
                {isLoading ? (
                     <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                ) : error ? (
                    <Alert variant="destructive"><ServerCrash className="h-4 w-4" /><AlertTitle>データ取得エラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                ) : userData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Courses Table */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Courses <Badge variant="secondary">{userData.courses.length}</Badge></CardTitle>
                                <Button size="sm" variant="outline" onClick={() => { setEditingCourse(null); setIsCourseModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>追加</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Day</TableHead><TableHead>Period</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {userData.courses.map(course => (
                                            <TableRow key={course.id}>
                                                <TableCell>{course.courseName}<br/><span className="text-xs text-muted-foreground">{course.location}</span></TableCell>
                                                <TableCell>{dayOfWeekMap[course.dayOfWeek]}</TableCell>
                                                <TableCell>{course.period}</TableCell>
                                                <TableCell className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingCourse(course); setIsCourseModalOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete({type: 'course', id: course.id})}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {userData.courses.length === 0 && <TableCaption>No courses found.</TableCaption>}
                                </Table>
                            </CardContent>
                        </Card>
                        {/* Tasks Table */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Tasks <Badge variant="secondary">{userData.tasks.length}</Badge></CardTitle>
                                <Button size="sm" variant="outline" onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>追加</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Task</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {userData.tasks.map(task => (
                                            <TableRow key={task.id}>
                                                <TableCell>{task.title}<br/><span className="text-xs text-muted-foreground">{task.course.courseName}</span></TableCell>
                                                <TableCell>{format(new Date(task.dueDate), 'MM/dd HH:mm')}</TableCell>
                                                <TableCell><Badge variant={task.isCompleted ? "default" : "secondary"}>{task.isCompleted ? 'Done' : 'Pending'}</Badge></TableCell>
                                                <TableCell className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}><Edit className="h-4 w-4"/></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setItemToDelete({type: 'task', id: task.id})}><Trash2 className="h-4 w-4"/></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {userData.tasks.length === 0 && <TableCaption>No tasks found.</TableCaption>}
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </div>

            {/* Course Modal */}
            <Dialog open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                        <DialogDescription>ユーザーのコース情報を編集します。</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveCourse} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="courseName">Course Name</Label><Input id="courseName" name="courseName" defaultValue={editingCourse?.courseName} required/></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2"><Label htmlFor="dayOfWeek">Day</Label><Select name="dayOfWeek" defaultValue={editingCourse?.dayOfWeek.toString()}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(dayOfWeekMap).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
                           <div className="space-y-2"><Label htmlFor="period">Period</Label><Select name="period" defaultValue={editingCourse?.period.toString()}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[1,2,3,4,5,6].map(p=><SelectItem key={p} value={p.toString()}>{p}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" defaultValue={editingCourse?.location || ''}/></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Course</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Task Modal */}
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                <DialogContent>
                    <DialogHeader>
                         <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                         <DialogDescription>ユーザーのタスク情報を編集します。</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTask} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={editingTask?.title} required/></div>
                        <div className="space-y-2"><Label htmlFor="courseId">Course</Label><Select name="courseId" defaultValue={editingTask?.courseId}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{userData?.courses.map(c=><SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="dueDate">Due Date</Label><Input id="dueDate" name="dueDate" type="datetime-local" defaultValue={editingTask ? format(new Date(editingTask.dueDate), "yyyy-MM-dd'T'HH:mm") : ''} required/></div>
                        <div className="space-y-2"><Label htmlFor="type">Type</Label><Select name="type" defaultValue={editingTask?.type}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ASSIGNMENT">Assignment</SelectItem><SelectItem value="EXAM">Exam</SelectItem></SelectContent></Select></div>
                        <div className="flex items-center space-x-2"><Input type="checkbox" id="isCompleted" name="isCompleted" defaultChecked={editingTask?.isCompleted}/><Label htmlFor="isCompleted">Completed</Label></div>
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save Task</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the {itemToDelete?.type}.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
