// src/components/dashboard/task-management-widget.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, AlertTriangle, Loader2, FileText, BookCheck, Pencil, Trash2 } from "lucide-react";
import { TaskFormDialog } from "./TaskFormDialog";
import { differenceInHours, isPast, format, differenceInMinutes } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Course } from "@/types/next-auth";

export interface Task {
  id: string;
  type: "ASSIGNMENT" | "EXAM";
  title: string;
  dueDate: string;
  isCompleted: boolean;
  course: { courseName: string };
  courseId: string;
  location?: string | null;
  period?: number | null;
}

const TaskItem = ({ task, onUpdate, isSelected, onToggleSelect }: { task: Task; onUpdate: () => void; isSelected: boolean; onToggleSelect: (taskId: string) => void; }) => {
  const { toast } = useToast();
  const [opacity, setOpacity] = useState(0.1);
  const now = new Date();
  const dueDate = new Date(task.dueDate);

  const isExamFinished = task.type === 'EXAM' && differenceInMinutes(now, dueDate) > 30;

  const hoursUntilDue = differenceInHours(dueDate, now);
  const isOverdue = isPast(dueDate) && !isExamFinished; // 시험이 끝난 경우는 Overdue로 치지 않음
  const isUrgent = hoursUntilDue <= 6 && !isPast(dueDate);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isUrgent) {
      interval = setInterval(() => {
        setOpacity(prev => Math.min(prev + 0.1, 0.85));
      }, 720000); // 2분마다
    }
    return () => clearInterval(interval);
  }, [isUrgent]);

  let borderColorClass = "border-transparent";
  let dynamicBgStyle = {};
  if (isOverdue) borderColorClass = "border-destructive";
  else if (isUrgent) {
    borderColorClass = "border-destructive";
    dynamicBgStyle = { backgroundColor: `rgba(220, 53, 69, ${opacity})` };
  } else if (hoursUntilDue < 72) borderColorClass = "border-yellow-500";
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('削除に失敗しました。');
      toast({ title: "成功", description: "タスクを削除しました。" });
      onUpdate();
    } catch (error) {
      toast({ title: "エラー", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className={cn("flex items-center space-x-3 p-3 rounded-lg border-l-4 transition-all", isOverdue ? 'animate-shake' : '', borderColorClass)} style={dynamicBgStyle}>
      {task.type === "ASSIGNMENT" && <Checkbox id={`task-sel-${task.id}`} checked={isSelected} onCheckedChange={() => onToggleSelect(task.id)} />}
      <div className="flex-1 space-y-1">
        <label htmlFor={`task-sel-${task.id}`} className="font-medium text-foreground cursor-pointer flex items-center">
          <FileText className="mr-2 h-4 w-4 text-primary shrink-0" />
          {isExamFinished ? "お疲れ様でした！" : task.title}
        </label>
        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>{task.course.courseName}{isExamFinished ? ` (${task.title})` : ''}</span>
          <span>|</span>
          <span>{format(dueDate, "M/d(E) HH:mm", { locale: ja })}</span>
          {isOverdue && <span className="text-destructive font-bold ml-2">期限切れ</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TaskFormDialog courses={[]} trigger={<Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>} onTaskUpdate={onUpdate} taskToEdit={task} />
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>本当に削除しますか？</AlertDialogTitle><AlertDialogDescription>この操作は元に戻せません。</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};


export function TaskManagementWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const assignments = useMemo(() => tasks.filter(t => t.type === 'ASSIGNMENT'), [tasks]);

  const fetchData = useCallback(async () => {
    // setIsLoading(true); // Don't show full loader on refetch
    setError(null);
    try {
      const [tasksRes, coursesRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/courses/all')]);
      if (!tasksRes.ok) throw new Error('タスクの読み込みに失敗しました。');
      if (!coursesRes.ok) throw new Error('講義情報の読み込みに失敗しました。');
      const tasksData = await tasksRes.json();
      const coursesData = await coursesRes.json();
      setTasks(tasksData);
      setCourses(coursesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const handleBatchComplete = async () => {
    if (selectedTasks.size === 0) return;
    try {
      const response = await fetch('/api/tasks/complete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: Array.from(selectedTasks) }),
      });
      if (!response.ok) throw new Error('一括完了処理に失敗しました。');
      toast({ title: "成功", description: `${selectedTasks.size}個の課題を完了しました。` });
      setSelectedTasks(new Set());
      fetchData();
    } catch (error) {
      toast({ title: "エラー", description: (error as Error).message, variant: "destructive" });
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>エラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (tasks.length === 0) return <div className="text-center py-8"><ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground font-medium text-lg">今後のタスクはありません。</p><p className="text-sm text-muted-foreground">新しいタスクを追加しましょう！</p></div>;
    return <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2">{tasks.map((task) => <TaskItem key={task.id} task={task} onUpdate={fetchData} isSelected={selectedTasks.has(task.id)} onToggleSelect={handleToggleSelect} />)}</div>;
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 xl:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-headline text-primary flex items-center">
                <ListChecks className="mr-3 h-6 w-6" />
                今後のタスク
            </CardTitle>
            <div className="flex items-center gap-2">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button size="sm" variant="secondary" className="bg-green-600 hover:bg-green-700 text-white" disabled={selectedTasks.size === 0}>
                            <BookCheck className="mr-2 h-4 w-4" />完了
                         </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>確認</AlertDialogTitle><AlertDialogDescription>{`選択した${selectedTasks.size}個の課題を完了処理しますか？`}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBatchComplete} className="bg-green-600 hover:bg-green-700">はい、完了します</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <TaskFormDialog trigger={<Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />追加</Button>} courses={courses} onTaskUpdate={fetchData} />
            </div>
        </div>
        <CardDescription>課題と試験の締め切り一覧</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
