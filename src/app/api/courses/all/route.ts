
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' },
      ],
    });
    
    // Prisma는 JSON을 지원하지 않으므로 number/string/boolean 등으로 변환
    const sanitizedCourses = courses.map(course => ({
      ...course,
      // location이 null일 경우 빈 문자열로 대체
      location: course.location || '',
    }));

    return NextResponse.json(sanitizedCourses, { status: 200 });
  } catch (error) {
    console.error('全講義情報の取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
