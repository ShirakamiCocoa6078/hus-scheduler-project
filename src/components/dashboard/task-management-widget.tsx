"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, ListChecks, AlertTriangle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import Image from "next/image";

interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO string
  priority: "High" | "Medium" | "Low";
  course?: string; // Optional: link to a course
  isMoodleAssignment?: boolean;
}

const mockTasks: Task[] = [
  { id: "1", title: "Submit CS505 Project Proposal", dueDate: "2024-08-15T23:59:00Z", priority: "High", course: "CS505", isMoodleAssignment: true },
  { id: "2", title: "Read Chapter 3 for LIT400", dueDate: "2024-08-10T23:59:00Z", priority: "Medium", course: "LIT400" },
  { id: "3", title: "CHM320 Lab Report", dueDate: "2024-08-05T23:59:00Z", priority: "High", course: "CHM320", isMoodleAssignment: true },
  { id: "4", title: "Prepare for Quantum Mechanics Quiz", dueDate: "2024-08-20T23:59:00Z", priority: "Medium" },
];

// Sort tasks by due date (ascending)
const sortedTasks = mockTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

export function TaskManagementWidget() {

  const getPriorityBadgeVariant = (priority: Task["priority"]): "destructive" | "secondary" | "default" => {
    if (priority === "High") return "destructive";
    if (priority === "Medium") return "secondary";
    return "default";
  };

  const getDueDateInfo = (dueDate: string) => {
    const due = parseISO(dueDate);
    const now = new Date();
    const daysRemaining = differenceInDays(due, now);

    if (isPast(due)) return { text: `Overdue by ${differenceInDays(now, due)} days`, color: "text-red-500 font-semibold" };
    if (daysRemaining === 0) return { text: "Due today", color: "text-orange-500 font-semibold" };
    if (daysRemaining === 1) return { text: "Due tomorrow", color: "text-yellow-600" };
    return { text: `Due in ${daysRemaining} days`, color: "text-green-600" };
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <ListChecks className="mr-3 h-6 w-6" />
          Upcoming Tasks
        </CardTitle>
        {/* <Button size="sm" variant="ghost">View All</Button> */}
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
                       {task.isMoodleAssignment && <CheckSquare className="mr-2 h-5 w-5 text-blue-500" titleAccess="Moodle Assignment"/>}
                       {task.title}
                    </h3>
                    <Badge variant={getPriorityBadgeVariant(task.priority)} className="ml-2 shrink-0">{task.priority}</Badge>
                  </div>
                  {task.course && <p className="text-xs text-muted-foreground mt-0.5">Course: {task.course}</p>}
                  <div className="flex items-center text-sm mt-1">
                    <CalendarClock className={`mr-2 h-4 w-4 ${dueDateInfo.color}`} />
                    <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                    <span className="text-xs text-muted-foreground ml-1">({format(parseISO(task.dueDate), "MMM d, p")})</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
           <div className="text-center py-8">
            <Image src="https://placehold.co/300x200.png" alt="No tasks placeholder" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="empty checklist" />
            <p className="text-muted-foreground font-medium text-lg">No pending tasks!</p>
            <p className="text-sm text-muted-foreground">Looks like you're all caught up.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
