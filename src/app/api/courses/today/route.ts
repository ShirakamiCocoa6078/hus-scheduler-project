'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// 교시별 시간 정보
const periodTimes: { [key: number]: { start: string; end: string } } = {
  1: { start: '09:00', end: '10:30' },
  2: { start: '10:40', end: '12:10' },
  3: { start: '13:00', end: '14:30' },
  4: { start: '14:40', end: '16:10' },
  5: { start: '16:20', end: '17:50' },
  6: { start: '18:00', end: '19:30' },
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    // 1. 클라이언트가 보낸 날짜 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ message: "日付パラメータが必要です。" }, { status: 400 });
    }

    // 2. 받은 날짜 문자열을 기준으로 요일 계산
    // 'T00:00:00'을 붙여 해당 날짜의 시작으로 해석되도록 함 (시간대 문제 방지)
    const targetDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = targetDate.getDay(); // 0 (일요일) - 6 (토요일)

    // 3. 해당 요일의 강의를 조회
    const courses = await prisma.course.findMany({
      where: {
        userId: session.user.id,
        dayOfWeek: dayOfWeek,
      },
      orderBy: {
        period: 'asc',
      },
    });
    
    // DB에서 가져온 데이터에 시작/종료 시간 추가
    const coursesWithTime = courses.map(course => ({
      ...course,
      startTime: periodTimes[course.period]?.start || 'N/A',
      endTime: periodTimes[course.period]?.end || 'N/A',
    }));

    return NextResponse.json(coursesWithTime, { status: 200 });

  } catch (error) {
    console.error('今日の講義情報の取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
