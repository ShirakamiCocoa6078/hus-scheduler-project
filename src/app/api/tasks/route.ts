// src/app/api/tasks/route.ts
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { subHours } from 'date-fns';

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

// POST: 새로운 과제 또는 시험 생성
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, dueDate, courseId, location, period } = body;

    if (!type || !title || !dueDate || !courseId) {
      return NextResponse.json({ message: '必須フィールドが不足しています。' }, { status: 400 });
    }

    const taskData: any = {
        userId: session.user.id,
        courseId: courseId,
        type: type,
        title: title,
        dueDate: new Date(dueDate),
        isCompleted: false,
      };

    // 타입이 'EXAM'일 경우, 시험 관련 데이터를 추가합니다.
    if (type === 'EXAM') {
        taskData.location = location;
        taskData.period = period ? parseInt(period, 10) : null;
    }

    const newTask = await prisma.task.create({
      data: taskData,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('タスクの作成エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
