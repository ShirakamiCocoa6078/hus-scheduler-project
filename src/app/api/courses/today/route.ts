'use server';

import { NextResponse } from 'next/server';
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
  6: { start: '18:00', end: '19:30' }, // 6교시 추가 (야간 등)
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '인증되지 않았습니다.' }, { status: 401 });
  }

  try {
    const today = new Date();
    // getDay()는 일요일=0, 월요일=1, ... 토요일=6을 반환
    const dayOfWeek = today.getDay(); 

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
    console.error('오늘의 강의 정보 조회 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
