
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  location: z.string().optional(),
  period: z.number().optional(),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;
  const { taskId } = params;

  try {
    const body = await request.json();
    const parsedData = taskUpdateSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ message: '無効なデータ形式です。', errors: parsedData.error.issues }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      return NextResponse.json({ message: 'タスクが見つからないか、権限がありません。' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...parsedData.data,
        dueDate: parsedData.data.dueDate ? new Date(parsedData.data.dueDate) : undefined,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(`タスク(ID: ${taskId})の更新エラー:`, error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }
  const userId = session.user.id;
  const { taskId } = params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      return NextResponse.json({ message: 'タスクが見つからないか、権限がありません。' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'タスクが正常に削除されました。' }, { status: 200 });
  } catch (error) {
    console.error(`タスク(ID: ${taskId})の削除エラー:`, error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
