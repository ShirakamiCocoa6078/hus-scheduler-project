
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, BookOpen, Clock, MapPin } from "lucide-react";
import Image from "next/image";

interface Course {
  id: string;
  name: string;
  code: string;
  time: string;
  location: string;
  instructor: string;
  day: string; // Example: "Monday", "Tuesday"
}

// Mock data - In a real app, this would come from an API or user input
const mockCourses: Course[] = [
  { id: "1", name: "量子コンピュータ特論", code: "CS505", time: "10:00 - 11:30", location: "301号室、工学棟", instructor: "エララ・ヴァンス博士", day: "月曜日" },
  { id: "2", name: "有機化学合成", code: "CHM320", time: "13:00 - 14:30", location: "2B実験室、理学棟", instructor: "田中健司教授", day: "月曜日" },
  { id: "3", name: "文学理論", code: "LIT400", time: "09:00 - 10:30", location: "Aホール、文学部", instructor: "アーニャ・シャルマ博士", day: "火曜日" },
];

// Helper to get today's day in Japanese
const getTodayJapanese = (): string => {
  const days = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  return days[new Date().getDay()];
};


export function CourseScheduleWidget() {
  const today = getTodayJapanese();
  const todayCourses = mockCourses.filter(course => course.day === today);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <CalendarDays className="mr-3 h-6 w-6" />
          本日のスケジュール
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayCourses.length > 0 ? (
          <div className="space-y-4">
            {todayCourses.map((course) => (
              <div key={course.id} className="p-4 rounded-md border bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <h3 className="font-semibold text-lg text-accent">{course.name} <span className="text-sm text-muted-foreground">({course.code})</span></h3>
                <p className="text-sm text-foreground flex items-center mt-1">
                  <Clock className="mr-2 h-4 w-4 text-primary" /> {course.time}
                </p>
                <p className="text-sm text-foreground flex items-center mt-1">
                  <MapPin className="mr-2 h-4 w-4 text-primary" /> {course.location}
                </p>
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <BookOpen className="mr-2 h-4 w-4" /> 担当教員: {course.instructor}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image src="https://placehold.co/300x200.png" alt="本日の授業はありません" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="empty calendar" />
            <p className="text-muted-foreground font-medium text-lg">本日は授業の予定がありません！</p>
            <p className="text-sm text-muted-foreground">自由時間を楽しむか、勉強に励みましょう。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
