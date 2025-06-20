
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, ListChecks, AlertTriangle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays, isPast, formatRelative } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from "next/image";

interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO string
  priority: "高" | "中" | "低"; // Changed to Japanese
  course?: string; 
  isMoodleAssignment?: boolean;
}

const mockTasks: Task[] = [
  { id: "1", title: "CS505プロジェクト提案書提出", dueDate: "2024-08-15T23:59:00Z", priority: "高", course: "CS505", isMoodleAssignment: true },
  { id: "2", title: "LIT400 第3章を読む", dueDate: "2024-08-10T23:59:00Z", priority: "中", course: "LIT400" },
  { id: "3", title: "CHM320 実験レポート", dueDate: "2024-08-05T23:59:00Z", priority: "高", course: "CHM320", isMoodleAssignment: true },
  { id: "4", title: "量子力学小テストの準備", dueDate: "2024-08-20T23:59:00Z", priority: "中" },
];

const sortedTasks = mockTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

export function TaskManagementWidget() {

  const getPriorityBadgeVariant = (priority: Task["priority"]): "destructive" | "secondary" | "default" => {
    if (priority === "高") return "destructive";
    if (priority === "中") return "secondary";
    return "default";
  };

  const getDueDateInfo = (dueDate: string) => {
    const due = parseISO(dueDate);
    const now = new Date();
    const daysRemaining = differenceInDays(due, now);

    if (isPast(due)) {
        const overdueDays = differenceInDays(now, due);
        return { text: `${overdueDays}日遅延`, color: "text-red-500 font-semibold" };
    }
    if (daysRemaining === 0) return { text: "本日締切", color: "text-orange-500 font-semibold" };
    if (daysRemaining === 1) return { text: "明日締切", color: "text-yellow-600" };
    return { text: `${daysRemaining}日後締切`, color: "text-green-600" };
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <ListChecks className="mr-3 h-6 w-6" />
          今後のタスク
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTasks.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {sortedTasks.map((task) => {
              const dueDateInfo = getDueDateInfo(task.dueDate);
              return (
                <div key={task.id} className="p-3 rounded-md border bg-card hover:bg-secondary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-md text-accent flex items-center">
                       {task.isMoodleAssignment && <CheckSquare className="mr-2 h-5 w-5 text-blue-500" title="Moodle課題"/>}
                       {task.title}
                    </h3>
                    <Badge variant={getPriorityBadgeVariant(task.priority)} className="ml-2 shrink-0">{task.priority}</Badge>
                  </div>
                  {task.course && <p className="text-xs text-muted-foreground mt-0.5">コース: {task.course}</p>}
                  <div className="flex items-center text-sm mt-1">
                    <CalendarClock className={`mr-2 h-4 w-4 ${dueDateInfo.color}`} />
                    <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                    <span className="text-xs text-muted-foreground ml-1">({format(parseISO(task.dueDate), "MMM d日 p", { locale: ja })})</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="text-center py-8">
            <Image src="https://placehold.co/300x200.png" alt="保留中のタスクはありません" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="empty checklist" />
            <p className="text-muted-foreground font-medium text-lg">保留中のタスクはありません！</p>
            <p className="text-sm text-muted-foreground">すべて完了しているようです。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
