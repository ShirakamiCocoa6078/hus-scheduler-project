
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const taskSchema = z.object({
  type: z.enum(['ASSIGNMENT', 'EXAM']),
  title: z.string().min(1, 'タイトルは必須です。'),
  courseId: z.string().min(1, '科目は必須です。'),
  dueDate: z.string().datetime(),
  location: z.string().optional(),
  period: z.number().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 古いタスクをクリーンアップ
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.task.deleteMany({
        where: { userId: userId, isCompleted: true },
      }),
      prisma.task.deleteMany({
        where: {
          userId: userId,
          type: 'EXAM',
          dueDate: { lt: twoHoursAgo },
        },
      }),
    ]);

    // 残りのタスクを取得
    const tasks = await prisma.task.findMany({
      where: { userId: userId },
      orderBy: { dueDate: 'asc' },
      include: { course: { select: { courseName: true } } },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('タスクの取得エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const parsedData = taskSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ message: '無効なデータです。', errors: parsedData.error.issues }, { status: 400 });
    }

    const { type, title, courseId, dueDate, location, period } = parsedData.data;

    const newTask = await prisma.task.create({
      data: {
        userId,
        courseId,
        type,
        title,
        dueDate: new Date(dueDate),
        location,
        period,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('タスクの作成エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
