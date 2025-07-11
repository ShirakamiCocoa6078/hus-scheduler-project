// src/app/api/courses/route.ts
'use server';

import { NextResponse } from 'next/server';
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
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

    const newCourse = await prisma.course.create({
      data: {
        ...parsedData,
        startTime: periodTimes[parsedData.period]?.start || 'N/A',
        endTime: periodTimes[parsedData.period]?.end || 'N/A',
        userId: session.user.id,
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: '無効なデータです。', errors: error.errors }, { status: 400 });
    }
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error creating course', error: errorMessage }, { status: 500 });
  }
}
