// src/app/api/courses/receive-from-portal/route.ts
'use server';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // CORS 헤더 설정 - 실제 프로덕션에서는 더 엄격하게 설정해야 합니다.
  const headers = {
    'Access-Control-Allow-Origin': '*', // 필요하다면 'https://unipa.hus.ac.jp'로 제한
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。HUS-schedulerにログインしてください。' }, { status: 401, headers });
  }
  
  try {
    const courseData = await request.json();
    if (!Array.isArray(courseData)) {
        return NextResponse.json({ message: '無効なデータ形式です。' }, { status: 400, headers });
    }
    
    // 사용자의 tempCoursesData 필드에 스크레이핑한 데이터를 저장
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            tempCoursesData: courseData
        }
    });

    return NextResponse.json({ message: 'データが正常に受信されました。' }, { status: 200, headers });

  } catch (error) {
    console.error('Portal 데이터 수신 오류:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500, headers });
  }
}

// 브라우저의 preflight 요청에 대응하기 위한 OPTIONS 핸들러
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
