// src/app/dashboard/schedule/edit/page.tsx
"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';

interface Course {
  id: string;
  courseName: string;
  dayOfWeek: number;
  period: number;
  location: string | null;
}

const dayOfWeekMap: { [key: number]: string } = { 1: "月", 2: "火", 3: "水", 4: "木", 5: "金", 6: "土", 0: "日" };

export default function ScheduleEditPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/courses/all");
      if (!res.ok) throw new Error("Failed to fetch courses.");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenModal = (course: Course | null) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      courseName: formData.get("courseName") as string,
      dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
      period: parseInt(formData.get("period") as string),
      location: formData.get("location") as string,
    };

    const url = editingCourse ? `/api/courses/${editingCourse.id}` : "/api/courses";
    const method = editingCourse ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save course.");
      }
      
      toast({ title: "成功", description: `講義が${editingCourse ? '更新' : '追加'}されました。` });
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      const res = await fetch(`/api/courses/${courseToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course.");
      toast({ title: "成功", description: "講義が削除されました。" });
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-headline">時間割の編集</CardTitle>
            <p className="text-muted-foreground">講義の追加、編集、削除ができます。</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" asChild><Link href="/dashboard/schedule/manage">UNIPAからインポート</Link></Button>
             <Button onClick={() => handleOpenModal(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                新しい講義を追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">
                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                <p>エラー: {error}</p>
            </div>
          ) : (
            <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>授業名</TableHead>
                  <TableHead>曜日</TableHead>
                  <TableHead>時限</TableHead>
                  <TableHead>教室</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length > 0 ? courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.courseName}</TableCell>
                    <TableCell>{dayOfWeekMap[course.dayOfWeek]}</TableCell>
                    <TableCell>{course.period}</TableCell>
                    <TableCell>{course.location || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setCourseToDelete(course)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            まだ講義が登録されていません。
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "講義の編集" : "新しい講義の追加"}</DialogTitle>
            <DialogDescription>講義の詳細を入力してください。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">授業名</Label>
              <Input id="courseName" name="courseName" defaultValue={editingCourse?.courseName} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">曜日</Label>
                    <Select name="dayOfWeek" defaultValue={editingCourse?.dayOfWeek.toString()}>
                        <SelectTrigger><SelectValue placeholder="曜日を選択"/></SelectTrigger>
                        <SelectContent>
                            {Object.entries(dayOfWeekMap).map(([value, label]) => 
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="period">時限</Label>
                    <Select name="period" defaultValue={editingCourse?.period.toString()}>
                        <SelectTrigger><SelectValue placeholder="時限を選択"/></SelectTrigger>
                        <SelectContent>
                            {[1,2,3,4,5,6].map(p => <SelectItem key={p} value={p.toString()}>{p}限</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">教室</Label>
              <Input id="location" name="location" defaultValue={editingCourse?.location || ""} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">キャンセル</Button>
              </DialogClose>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              「{courseToDelete?.courseName}」を本当に削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
