// src/app/api/courses/confirm/route.ts
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 최종 강의 정보를 저장하는 POST 핸들러
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  const userId = session.user.id;
  
  try {
    const finalCourses = await request.json();

    if (!Array.isArray(finalCourses)) {
        return NextResponse.json({ message: '無効なデータ形式です。' }, { status: 400 });
    }

    // 트랜잭션을 사용하여 데이터 일관성 보장
    const transaction = await prisma.$transaction([
      // 1. 이 사용자의 기존 강의 정보 모두 삭제
      prisma.course.deleteMany({
        where: { userId: userId },
      }),
      // 2. 새로운 강의 정보 생성
      prisma.course.createMany({
        data: finalCourses.map(course => ({
          courseName: course.courseName,
          dayOfWeek: Number(course.dayOfWeek),
          period: Number(course.period),
          location: course.location,
          userId: userId,
        })),
      }),
    ]);

    return NextResponse.json({ message: '時間割が正常に保存されました。', count: transaction[1].count }, { status: 200 });
  } catch (error) {
    console.error('강의 정보 저장 오류:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
