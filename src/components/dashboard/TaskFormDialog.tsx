// src/components/dashboard/TaskFormDialog.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
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

// Zod schema for validation
const taskFormSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['ASSIGNMENT', 'EXAM'], { required_error: "タイプを選択してください。" }),
    title: z.string().min(1, { message: "タイトルは必須です。" }),
    courseId: z.string().min(1, { message: "科目は必須です。" }),
    dueDate: z.date({ required_error: "日付は必須です。" }),
    dueTime: z.string().optional(),
    location: z.string().optional(),
    period: z.coerce.number().optional(),
}).refine(data => {
    if (data.type === 'ASSIGNMENT') {
        return !!data.dueTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.dueTime);
    }
    return true;
}, {
    message: "締め切り時間は必須です。",
    path: ["dueTime"],
}).refine(data => {
    if (data.type === 'EXAM') {
        return !!data.period;
    }
    return true;
}, {
    message: "時限は必須です。",
    path: ["period"],
});


type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  trigger: ReactNode;
  courses?: Course[];
  taskToEdit?: Task;
  onTaskUpdate: () => void;
}

export function TaskFormDialog({ trigger, courses = [], taskToEdit, onTaskUpdate }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const isEditMode = !!taskToEdit;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      type: 'ASSIGNMENT',
      title: '',
      courseId: '',
      dueTime: '23:59',
      location: '',
      period: undefined,
    }
  });
  
  const selectedType = form.watch('type');

  useEffect(() => {
    if (open) {
      if (taskToEdit) {
        form.reset({
          id: taskToEdit.id,
          type: taskToEdit.type,
          title: taskToEdit.title,
          courseId: taskToEdit.courseId,
          dueDate: new Date(taskToEdit.dueDate),
          dueTime: format(new Date(taskToEdit.dueDate), 'HH:mm'),
          location: taskToEdit.location || '',
          period: taskToEdit.period || undefined,
        });
      } else {
        form.reset({
          type: 'ASSIGNMENT',
          title: '',
          courseId: '',
          dueTime: '23:59',
          location: '',
          period: undefined,
          dueDate: undefined,
        });
      }
    }
  }, [open, taskToEdit, form]);

  const onValidationFail = (errors: any) => {
    const errorMessages = Object.values(errors).map((e: any) => `- ${e.message}`).join('\n');
    toast({
      variant: "destructive",
      title: "入力項目を確認してください",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-destructive-foreground/10 p-4">
          <code className="text-destructive">{errorMessages}</code>
        </pre>
      ),
    });
  };

  const onSubmit = async (data: TaskFormValues) => {
    let combinedDueDate: Date;
    if (data.type === 'ASSIGNMENT' && data.dueTime && data.dueDate) {
      const [hours, minutes] = data.dueTime.split(':').map(Number);
      combinedDueDate = setMinutes(setHours(data.dueDate, hours), minutes);
    } else if (data.dueDate) {
      combinedDueDate = data.dueDate;
    } else {
        // Should not happen due to validation, but as a fallback
        toast({ title: "エラー", description: "日付が無効です。", variant: "destructive" });
        return;
    }

    const payload = {
      ...data,
      dueDate: combinedDueDate.toISOString(),
      period: data.type === 'EXAM' ? data.period : null,
      location: data.type === 'EXAM' ? data.location : null,
    };
    
    const url = isEditMode && payload.id ? `/api/tasks/${payload.id}` : '/api/tasks';
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onValidationFail)}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'タスクの編集' : '新しいタスクの追加'}</DialogTitle>
              <DialogDescription>詳細を入力してください。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                        <FormItem><FormControl><RadioGroupItem value="ASSIGNMENT" id="r1" className="peer sr-only" /></FormControl><FormLabel htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">課題</FormLabel></FormItem>
                        <FormItem><FormControl><RadioGroupItem value="EXAM" id="r2" className="peer sr-only" /></FormControl><FormLabel htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">試験</FormLabel></FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="科目を選択" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {courses?.map(course => <SelectItem key={course.id} value={course.id}>{course.courseName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedType === 'ASSIGNMENT' ? '課題名' : '試験名'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>日付</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: ja }) : <span>日付を選択</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                  />
                  {selectedType === 'ASSIGNMENT' ? (
                      <FormField
                        control={form.control}
                        name="dueTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>締め切り</FormLabel>
                                <FormControl><Input type="time" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                      />
                  ) : (
                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>試験時限</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="時限を選択" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map(p => (<SelectItem key={p} value={String(p)}>{p}時限</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  )}
              </div>
              
              {selectedType === 'EXAM' && (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>試験場所</FormLabel>
                        <FormControl><Input placeholder="例: G201" value={field.value || ''} onChange={field.onChange} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">キャンセル</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? '更新' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
