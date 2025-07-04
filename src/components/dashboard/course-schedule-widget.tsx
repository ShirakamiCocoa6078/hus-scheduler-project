"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, BookOpen, Clock, MapPin, Loader2, AlertTriangle, PlusCircle, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  courseName: string;
  period: number;
  startTime: string;
  endTime: string;
  location: string | null;
}

const CourseSkeleton = () => (
    <div className="p-4 rounded-md border bg-secondary/30">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
    </div>
);

export function CourseScheduleWidget() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/courses/today');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '講義情報の読み込みに失敗しました。');
        }
        const data: Course[] = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <CourseSkeleton />
          <CourseSkeleton />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <p className="font-semibold">エラー発生</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    
    if (courses.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            本日は講義の予定がありません。
          </p>
          <Button asChild className="mt-4">
            <Link href="/schedule/manage">
              <PlusCircle className="mr-2 h-4 w-4" />
              時間割を追加する
            </Link>
          </Button>
        </div>
      );
    }
    
    const now = new Date();
    const currentTimeValue = now.getHours() * 100 + now.getMinutes();

    return (
      <div className="space-y-3">
        {courses.map((course) => {
          const startTimeValue = parseInt(course.startTime.replace(':', ''), 10);
          const endTimeValue = parseInt(course.endTime.replace(':', ''), 10);
          const isCurrent = currentTimeValue >= startTimeValue && currentTimeValue < endTimeValue;

          return (
            <div 
              key={course.id} 
              className={cn(
                "p-4 rounded-md border transition-all",
                isCurrent ? 'border-primary shadow-md bg-primary/10' : 'bg-secondary/30'
              )}
            >
              <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-accent">{course.courseName}</h3>
                  {isCurrent && <Badge variant="default">進行中</Badge>}
              </div>
              <div className="mt-2 space-y-1 text-sm">
                  <p className="text-foreground flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" /> 
                    {course.period}限 ({course.startTime} - {course.endTime})
                  </p>
                  {course.location && (
                    <p className="text-muted-foreground flex items-center">
                      <MapPin className="mr-2 h-4 w-4" /> {course.location}
                    </p>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <BookOpen className="mr-3 h-6 w-6" />
          本日のスケジュール
        </CardTitle>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/schedule/manage" aria-label="時間割を編集">
            <Pencil className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
