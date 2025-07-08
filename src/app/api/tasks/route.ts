// src/app/api/tasks/route.ts
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { subHours } from 'date-fns';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// Zod 스키마 정의 (dueTime을 optional로 변경)
const taskFormSchema = z.object({
  type: z.enum(['ASSIGNMENT', 'EXAM']),
  title: z.string().min(1),
  courseId: z.string().min(1),
  dueDate: z.date(),
  dueTime: z.string().optional(),
  location: z.string().optional(),
  period: z.coerce.number().optional(),
});


// GET: 사용자의 모든 활성 과제 및 시험 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const now = new Date();

    // 1. 자동 정리: 완료된 과제와 지난 시험을 삭제
    await prisma.$transaction([
      // 완료된 과제 삭제
      prisma.task.deleteMany({
        where: { userId: userId, type: 'ASSIGNMENT', isCompleted: true },
      }),
      // 2시간 이상 지난 시험 삭제
      prisma.task.deleteMany({
        where: {
          userId: userId,
          type: 'EXAM',
          dueDate: { lt: subHours(now, 2) },
        },
      }),
    ]);

    // 2. 남은 과제 및 시험 조회 (연결된 강의명 포함)
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      include: {
        course: {
          select: { courseName: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('タスクの取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

const examTimeMap: { [key: number]: { hours: number; minutes: number } } = {
    1: { hours: 9, minutes: 0 }, 2: { hours: 10, minutes: 40 }, 3: { hours: 13, minutes: 0 },
    4: { hours: 14, minutes: 40 }, 5: { hours: 16, minutes: 20 }, 6: { hours: 18, minutes: 0 },
};

// POST: 새로운 과제 또는 시험 생성
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    
    // Zod 스키마를 사용하여 유효성 검사 (dueDate는 string으로 받아서 date로 변환)
    const validatedData = taskFormSchema.extend({
        dueDate: z.string(),
    }).parse(body);

    let finalDueDate = new Date(validatedData.dueDate);

    // 타입에 따라 시간 설정
    if (validatedData.type === 'EXAM' && validatedData.period) {
      const time = examTimeMap[validatedData.period];
      if (time) finalDueDate.setHours(time.hours, time.minutes, 0, 0);
    } else if (validatedData.type === 'ASSIGNMENT' && validatedData.dueTime) {
      const [hours, minutes] = validatedData.dueTime.split(':').map(Number);
      finalDueDate.setHours(hours, minutes, 0, 0);
    }

    // DB에 저장할 최종 데이터 구성
    const taskData: Prisma.TaskCreateInput = {
      user: { connect: { id: userId } },
      course: { connect: { id: validatedData.courseId } },
      type: validatedData.type,
      title: validatedData.title,
      dueDate: finalDueDate,
      isCompleted: false, // isCompleted 필드 추가
      location: validatedData.type === 'EXAM' ? validatedData.location : null,
      period: validatedData.type === 'EXAM' ? validatedData.period : null,
    };

    const newTask = await prisma.task.create({ data: taskData });
    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('タスクの作成エラー:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: '無効なデータです。', errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}