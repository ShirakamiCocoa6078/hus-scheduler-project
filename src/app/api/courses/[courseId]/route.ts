// src/app/api/courses/[courseId]/route.ts
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const courseSchema = z.object({
  courseName: z.string().min(1, "授業名は必須です。"),
  dayOfWeek: z.number().min(0).max(6),
  period: z.number().min(1).max(6),
  location: z.string().optional().nullable(),
});

async function checkCourseOwnership(courseId: string, userId: string): Promise<boolean> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    return course?.userId === userId;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  
  const { courseId } = params;
  if (!await checkCourseOwnership(courseId, session.user.id)) {
      return NextResponse.json({ message: '権限がありません。' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsedData = courseSchema.parse(body);

    const periodTimes: { [key: number]: { start: string; end: string } } = {
        1: { start: '09:00', end: '10:30' },
        2: { start: '10:40', end: '12:10' },
        3: { start: '13:00', end: '14:30' },
        4: { start: '14:40', end: '16:10' },
        5: { start: '16:20', end: '17:50' },
        6: { start: '18:00', end: '19:30' },
    };
    
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...parsedData,
        startTime: periodTimes[parsedData.period]?.start || 'N/A',
        endTime: periodTimes[parsedData.period]?.end || 'N/A',
      },
    });

    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: '無効なデータです。', errors: error.errors }, { status: 400 });
    }
    console.error('Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error updating course', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  
  const { courseId } = params;
  if (!await checkCourseOwnership(courseId, session.user.id)) {
      return NextResponse.json({ message: '権限がありません。' }, { status: 403 });
  }

  try {
    await prisma.course.delete({
      where: { id: courseId },
    });
    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error deleting course', error: errorMessage }, { status: 500 });
  }
}
