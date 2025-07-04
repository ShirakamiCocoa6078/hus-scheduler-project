
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, BookOpen, Clock, MapPin, Loader2, AlertTriangle, PlusCircle, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
          throw new Error(errorData.message || '강의 정보를 불러오는 데 실패했습니다.');
        }
        const data: Course[] = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
          <p className="font-semibold">오류 발생</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    
    if (courses.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-medium text-lg">
            오늘은 강의가 없거나, 시간표가 등록되지 않았습니다.
          </p>
          <Button asChild className="mt-4">
            <Link href="/schedule/manage">
              <PlusCircle className="mr-2 h-4 w-4" />
              강의 시간표 추가하기
            </Link>
          </Button>
        </div>
      );
    }
    
    const now = new Date();
    const currentTimeValue = now.getHours() * 100 + now.getMinutes();

    return (
      <div className="space-y-4">
        {courses.map((course) => {
          const startTimeValue = parseInt(course.startTime.replace(':', ''), 10);
          const endTimeValue = parseInt(course.endTime.replace(':', ''), 10);
          const isCurrent = currentTimeValue >= startTimeValue && currentTimeValue < endTimeValue;

          return (
            <div 
              key={course.id} 
              className={cn(
                "p-4 rounded-md border bg-secondary/30 hover:bg-secondary/50 transition-all",
                isCurrent && "border-primary ring-2 ring-primary shadow-lg"
              )}
            >
              <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-accent">{course.courseName}</h3>
                  {isCurrent && <span className="text-xs font-bold text-primary animate-pulse">진행 중</span>}
              </div>
              <p className="text-sm text-foreground flex items-center mt-1">
                <Clock className="mr-2 h-4 w-4 text-primary" /> 
                {course.period}교시 ({course.startTime} - {course.endTime})
              </p>
              {course.location && (
                <p className="text-sm text-foreground flex items-center mt-1">
                  <MapPin className="mr-2 h-4 w-4 text-primary" /> {course.location}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
