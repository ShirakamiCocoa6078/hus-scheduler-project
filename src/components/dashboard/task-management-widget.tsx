// src/components/dashboard/task-management-widget.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, PlusCircle, AlertTriangle, Loader2, FileText, FileVideo, Pencil, Trash2 } from "lucide-react";
import { TaskFormDialog } from "./TaskFormDialog";
import { differenceInDays, format, isPast } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Course } from "@/types/next-auth"; // Course 타입을 가져옵니다.

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

const TaskItem = ({ task, onUpdate }: { task: Task; onUpdate: () => void }) => {
  const { toast } = useToast();
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const daysUntilDue = differenceInDays(dueDate, now);
  const isOverdue = isPast(dueDate) && !task.isCompleted;

  const handleComplete = async (completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: completed }),
      });
      if (!response.ok) throw new Error('状態の更新に失敗しました。');
      toast({ title: "成功", description: "課題の状態を更新しました。" });
      onUpdate();
    } catch (error) {
      toast({ title: "エラー", description: (error as Error).message, variant: "destructive" });
    }
  };

  let borderColorClass = "border-transparent";
  if (isOverdue) borderColorClass = "border-destructive";
  else if (daysUntilDue < 3) borderColorClass = "border-yellow-500";
  else if (daysUntilDue < 7) borderColorClass = "border-primary/50";

  return (
    <div className={cn(
      "flex items-center space-x-4 p-3 rounded-lg border-l-4 transition-all",
      isOverdue ? 'animate-shake bg-destructive/10' : 'bg-card',
      borderColorClass
    )}>
      {task.type === "ASSIGNMENT" ? (
        <Checkbox id={`task-${task.id}`} onCheckedChange={handleComplete} />
      ) : (
        <FileVideo className="h-5 w-5 text-primary flex-shrink-0" />
      )}
      <div className="flex-1">
        <label htmlFor={`task-${task.id}`} className="font-medium text-foreground cursor-pointer">{task.title}</label>
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <span>{task.course.courseName}</span>
          <span>{format(dueDate, "M月d日 (E) HH:mm", { locale: ja })}</span>
          {isOverdue && <span className="text-destructive font-bold">期限切れ</span>}
        </div>
      </div>
      <TaskFormDialog trigger={<Pencil className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" />} onTaskUpdate={onUpdate} taskToEdit={task} />
    </div>
  );
};

export function TaskManagementWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/courses/all')
      ]);

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

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    if (tasks.length === 0) {
      return (
        <div className="text-center py-8">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium text-lg">今後のタスクはありません。</p>
          <p className="text-sm text-muted-foreground">新しいタスクを追加しましょう！</p>
        </div>
      );
    }
    return (
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onUpdate={fetchData} />
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 xl:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-headline text-primary flex items-center">
            <FileText className="mr-3 h-6 w-6" />
            今後のタスク
          </CardTitle>
          <CardDescription>課題と試験の締め切り一覧</CardDescription>
        </div>
        <TaskFormDialog
          trigger={<Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />追加</Button>}
          courses={courses}
          onTaskUpdate={fetchData}
        />
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
