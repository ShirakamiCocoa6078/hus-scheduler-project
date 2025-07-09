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

  const userId = session.user.id;

  try {
    const { moodleUrl } = await request.json();

    if (typeof moodleUrl !== 'string') {
        return NextResponse.json({ message: '無効なURL形式です。' }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { moodleCalendarUrl: moodleUrl },
    });

    return NextResponse.json({ message: 'MoodleカレンダーのURLが正常に保存されました。' }, { status: 200 });

  } catch (error) {
    console.error('Moodle URL保存エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
