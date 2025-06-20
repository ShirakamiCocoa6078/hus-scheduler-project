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
  day: string;
}

const mockCourses: Course[] = [
  { id: "1", name: "Advanced Quantum Computing", code: "CS505", time: "10:00 - 11:30", location: "Room 301, Eng. Bldg.", instructor: "Dr. Elara Vance", day: "Monday" },
  { id: "2", name: "Organic Chemistry Synthesis", code: "CHM320", time: "13:00 - 14:30", location: "Lab 2B, Sci. Wing", instructor: "Prof. Kenji Tanaka", day: "Monday" },
  { id: "3", name: "Literary Theory", code: "LIT400", time: "09:00 - 10:30", location: "Hall A, Arts Faculty", instructor: "Dr. Anya Sharma", day: "Tuesday" },
];


export function CourseScheduleWidget() {
  // In a real app, fetch courses for the current day or week
  const todayCourses = mockCourses.filter(course => course.day === "Monday"); // Example: filter for Monday

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <CalendarDays className="mr-3 h-6 w-6" />
          Today's Schedule
        </CardTitle>
        {/* Optional: Action button like "View Full Schedule" */}
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
                  <BookOpen className="mr-2 h-4 w-4" /> Instructor: {course.instructor}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image src="https://placehold.co/300x200.png" alt="Empty schedule placeholder" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="empty calendar" />
            <p className="text-muted-foreground font-medium text-lg">No classes scheduled for today!</p>
            <p className="text-sm text-muted-foreground">Enjoy your free time or catch up on studies.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
