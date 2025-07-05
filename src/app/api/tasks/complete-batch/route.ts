// src/app/api/tasks/complete-batch/route.ts
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const { taskIds } = await request.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ message: '無効なデータです。' }, { status: 400 });
    }

    const result = await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        userId: session.user.id, // 본인의 과제만 업데이트하도록 제한
        type: 'ASSIGNMENT', // 과제 타입만 완료 처리 가능
      },
      data: {
        isCompleted: true,
      },
    });

    return NextResponse.json({ message: `${result.count}個のタスクを完了しました。`, count: result.count }, { status: 200 });
  } catch (error) {
    console.error('タスクの一括完了エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
