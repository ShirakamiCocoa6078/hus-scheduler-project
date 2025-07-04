
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ListChecks, Plus, Loader2, FileText, BookCopy, Calendar as CalendarIcon, Clock, MapPin, AlertTriangle, Trash2, Pencil, GripVertical } from "lucide-react";
import { format, formatDistanceToNowStrict, isPast, setHours, setMinutes, setSeconds } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

// --- Types ---
interface Course {
  id: string;
  courseName: string;
}
interface Task {
  id: string;
  type: 'ASSIGNMENT' | 'EXAM';
  title: string;
  dueDate: string;
  isCompleted: boolean;
  course: { courseName: string };
  location?: string;
  period?: number;
}

// --- Form Schema ---
const taskFormSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["ASSIGNMENT", "EXAM"], { required_error: "タイプを選択してください。" }),
  title: z.string().min(1, "タイトルを入力してください。"),
  courseId: z.string({ required_error: "科目を選択してください。" }),
  dueDate: z.date({ required_error: "日付を選択してください。" }),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM形式で入力してください。"),
  location: z.string().optional(),
  period: z.coerce.number().optional(),
});
type TaskFormData = z.infer<typeof taskFormSchema>;

export function TaskManagementWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTasksAndCourses = useCallback(async () => {
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/courses/all')
      ]);
      if (!tasksRes.ok || !coursesRes.ok) throw new Error('データの読み込みに失敗しました。');
      const tasksData = await tasksRes.json();
      const coursesData = await coursesRes.json();
      setTasks(tasksData);
      setCourses(coursesData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: error instanceof Error ? error.message : '不明なエラー' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasksAndCourses();
  }, [fetchTasksAndCourses]);
  
  const handleTaskComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (!response.ok) throw new Error('タスクの状態更新に失敗しました。');
      toast({ title: '更新しました', description: 'タスクを完了にしました。' });
      fetchTasksAndCourses();
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: error instanceof Error ? error.message : '不明なエラー' });
    }
  };

  const getTaskItemStyle = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    if (isPast(dueDate)) return "border-destructive bg-destructive/10 animate-shake";
    const daysUntilDue = (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    if (daysUntilDue <= 1) return "border-destructive/70 bg-destructive/5";
    if (daysUntilDue <= 3) return "border-primary/50 bg-primary/5";
    return "border-border";
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 xl:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <ListChecks className="mr-3 h-6 w-6" />
            今後のタスク
          </CardTitle>
          <CardDescription>期限の近い課題と試験</CardDescription>
        </div>
        <TaskDialog courses={courses} onTaskAdded={fetchTasksAndCourses} triggerButton={<Button size="sm"><Plus className="mr-2 h-4 w-4"/>追加</Button>} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <p className="font-semibold">今後のタスクはありません</p>
            <p className="text-sm">新しい課題や試験を追加しましょう。</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {tasks.map(task => (
              <div key={task.id} className={cn("p-3 rounded-lg border transition-all flex items-start gap-3", getTaskItemStyle(task.dueDate))}>
                {task.type === 'ASSIGNMENT' && <Checkbox checked={task.isCompleted} onCheckedChange={(checked) => handleTaskComplete(task.id, !!checked)} className="mt-1" />}
                {task.type === 'EXAM' && <BookCopy className="h-5 w-5 mt-1 text-primary" />}
                <div className="flex-grow">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.course.courseName}</p>
                  <div className="text-xs text-primary flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true, locale: ja })}</span>
                    <span className="mx-1">·</span>
                    <span>{format(new Date(task.dueDate), 'M月d日 HH:mm')}</span>
                  </div>
                  {isPast(new Date(task.dueDate)) && task.type === 'ASSIGNMENT' && !task.isCompleted && <span className="text-xs font-bold text-destructive">期限切れ</span>}
                </div>
                <TaskDialog courses={courses} onTaskAdded={fetchTasksAndCourses} taskToEdit={task} triggerButton={<Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-4 w-4"/></Button>} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Add/Edit Dialog Component ---
function TaskDialog({ courses, onTaskAdded, taskToEdit, triggerButton }: { courses: Course[], onTaskAdded: () => void, taskToEdit?: Task, triggerButton: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const defaultValues: Partial<TaskFormData> = taskToEdit
    ? {
        id: taskToEdit.id,
        type: taskToEdit.type,
        title: taskToEdit.title,
        courseId: courses.find(c => c.courseName === taskToEdit.course.courseName)?.id || "",
        dueDate: new Date(taskToEdit.dueDate),
        dueTime: format(new Date(taskToEdit.dueDate), "HH:mm"),
        location: taskToEdit.location,
        period: taskToEdit.period,
      }
    : { type: "ASSIGNMENT", dueTime: "23:59" };

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [taskToEdit, courses, form]);
  
  const watchType = form.watch("type");

  const onSubmit = async (data: TaskFormData) => {
    const [hours, minutes] = data.dueTime.split(':').map(Number);
    const fullDueDate = setSeconds(setMinutes(setHours(data.dueDate, hours), minutes), 0);
    
    const payload = {
      type: data.type,
      title: data.title,
      courseId: data.courseId,
      dueDate: fullDueDate.toISOString(),
      ...(data.type === 'EXAM' && { location: data.location, period: data.period }),
    };

    try {
      const url = taskToEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks';
      const method = taskToEdit ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(taskToEdit ? '更新に失敗しました' : '追加に失敗しました');
      
      toast({ title: '成功', description: `タスクを${taskToEdit ? '更新' : '追加'}しました。` });
      onTaskAdded();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'エラー', description: error instanceof Error ? error.message : '不明なエラー' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'タスクの編集' : '新しいタスクの追加'}</DialogTitle>
          <DialogDescription>課題または試験の詳細を入力してください。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem className="space-y-2"><FormLabel>タイプ</FormLabel>
                <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="ASSIGNMENT" id="r1" /></FormControl><Label htmlFor="r1">課題</Label></FormItem>
                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="EXAM" id="r2" /></FormControl><Label htmlFor="r2">試験</Label></FormItem>
                </RadioGroup></FormControl><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="courseId" render={({ field }) => (
              <FormItem><FormLabel>科目</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="科目を選択..." /></SelectTrigger></FormControl>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.courseName}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>{watchType === 'EXAM' ? '試験名' : '課題名'}</FormLabel><FormControl><Input placeholder={watchType === 'EXAM' ? '例: 前期末試験' : '例: レポート第1回'} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>{watchType === 'EXAM' ? '試験日' : '提出日'}</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP", { locale: ja }) : <span>日付を選択</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button></FormControl>
                  </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent></Popover><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="dueTime" render={({ field }) => (
                <FormItem><FormLabel>{watchType === 'EXAM' ? '開始時刻' : '締切時刻'}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            {watchType === 'EXAM' && (<div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="period" render={({ field }) => (
                  <FormItem><FormLabel>試験時限</FormLabel>
                    <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value?.toString()}>
                      <FormControl><SelectTrigger><SelectValue placeholder="時限を選択" /></SelectTrigger></FormControl>
                      <SelectContent>{[1,2,3,4,5,6].map(p => <SelectItem key={p} value={String(p)}>{p}限</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>試験場所</FormLabel><FormControl><Input placeholder="例: G201教室" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>)}
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {taskToEdit ? '更新する' : '追加する'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

