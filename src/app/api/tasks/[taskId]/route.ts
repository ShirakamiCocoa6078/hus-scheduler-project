// src/app/api/tasks/[taskId]/route.ts
'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

async function checkTaskOwnership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!task || task.userId !== userId) {
    return false;
  }
  return true;
}

// PATCH: 과제/시험 정보 수정 (완료 처리 포함)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  const taskId = params.taskId;
  if (!await checkTaskOwnership(taskId, session.user.id)) {
    return NextResponse.json({ message: '権限がありません。' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { isCompleted, title, dueDate, courseId, location, period, type } = body;
    
    // isCompleted가 undefined가 아닌 경우, 즉 완료/미완료 상태 변경 요청일 때
    // 다른 정보는 업데이트 하지 않음
    if (typeof isCompleted === 'boolean') {
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { isCompleted },
        });
        return NextResponse.json(updatedTask, { status: 200 });
    }

    // 그 외 정보 수정
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title,
        type: type,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        courseId: courseId,
        location: location,
        period: period ? parseInt(period, 10) : null,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error(`タスク(id: ${taskId})の更新エラー:`, error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// DELETE: 과제/시험 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  const taskId = params.taskId;
  if (!await checkTaskOwnership(taskId, session.user.id)) {
    return NextResponse.json({ message: '権限がありません。' }, { status: 403 });
  }

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    return NextResponse.json({ message: 'タスクが削除されました。' }, { status: 200 });
  } catch (error) {
    console.error(`タスク(id: ${taskId})の削除エラー:`, error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
