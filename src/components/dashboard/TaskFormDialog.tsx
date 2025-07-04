// src/components/dashboard/TaskFormDialog.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Task } from './task-management-widget';
import type { Course } from '@/types/next-auth';

interface TaskFormDialogProps {
  trigger: ReactNode;
  courses?: Course[];
  taskToEdit?: Task;
  onTaskUpdate: () => void;
}

export function TaskFormDialog({ trigger, courses = [], taskToEdit, onTaskUpdate }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'ASSIGNMENT' | 'EXAM'>(taskToEdit?.type || 'ASSIGNMENT');
  const [courseId, setCourseId] = useState(taskToEdit?.courseId || '');
  const [title, setTitle] = useState(taskToEdit?.title || '');
  const [date, setDate] = useState<Date | undefined>(taskToEdit ? new Date(taskToEdit.dueDate) : undefined);
  const [time, setTime] = useState(taskToEdit ? format(new Date(taskToEdit.dueDate), 'HH:mm') : '23:59');
  const [location, setLocation] = useState(taskToEdit?.location || '');
  const [period, setPeriod] = useState(taskToEdit?.period?.toString() || '');
  const { toast } = useToast();
  
  const isEditMode = !!taskToEdit;

  useEffect(() => {
    if (taskToEdit) {
      setType(taskToEdit.type);
      setCourseId(taskToEdit.courseId);
      setTitle(taskToEdit.title);
      setDate(new Date(taskToEdit.dueDate));
      setTime(format(new Date(taskToEdit.dueDate), 'HH:mm'));
      setLocation(taskToEdit.location || '');
      setPeriod(taskToEdit.period?.toString() || '');
    }
  }, [taskToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!date || !courseId || !title) {
      toast({ title: "エラー", description: "必須項目を入力してください。", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const combinedDueDate = setMinutes(setHours(date, hours), minutes);

    const payload = {
      type,
      courseId,
      title,
      dueDate: combinedDueDate.toISOString(),
      location: type === 'EXAM' ? location : null,
      period: type === 'EXAM' && period ? parseInt(period, 10) : null,
    };
    
    const url = isEditMode ? `/api/tasks/${taskToEdit.id}` : '/api/tasks';
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存に失敗しました。');
      }

      toast({
        title: "成功",
        description: `タスクが${isEditMode ? '更新' : '作成'}されました。`,
      });
      onTaskUpdate();
      setOpen(false);
    } catch (error) {
      toast({ title: "エラー", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'タスクの編集' : '新しいタスクの追加'}</DialogTitle>
            <DialogDescription>詳細を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={type} onValueChange={(v) => setType(v as 'ASSIGNMENT' | 'EXAM')} className="grid grid-cols-2 gap-4">
              <div><RadioGroupItem value="ASSIGNMENT" id="r1" className="peer sr-only" /><Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">課題</Label></div>
              <div><RadioGroupItem value="EXAM" id="r2" className="peer sr-only" /><Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">試験</Label></div>
            </RadioGroup>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course" className="text-right">科目</Label>
              <Select value={courseId} onValueChange={setCourseId} required>
                <SelectTrigger id="course" className="col-span-3"><SelectValue placeholder="科目を選択" /></SelectTrigger>
                <SelectContent>
                  {courses.map(course => <SelectItem key={course.id} value={course.id}>{course.courseName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">{type === 'ASSIGNMENT' ? '課題名' : '試験名'}</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">日付</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ja }) : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
              </Popover>
            </div>

            {type === 'ASSIGNMENT' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">締め切り</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3" required />
              </div>
            )}

            {type === 'EXAM' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">時限</Label>
                  <Input id="period" type="number" value={period} onChange={(e) => setPeriod(e.target.value)} className="col-span-3" placeholder="例: 3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">場所</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" placeholder="例: G201講義室" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? '更新' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
