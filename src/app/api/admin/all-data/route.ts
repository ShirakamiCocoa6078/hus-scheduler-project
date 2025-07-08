// /api/admin/all-data/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // 올바른 prisma 클라이언트 경로

export async function GET() {
  // 실제 프로덕션에서는 관리자만 접근할 수 있도록 인증/권한 체크가 필요합니다.
  try {
    const users = await prisma.user.findMany();
    const courses = await prisma.course.findMany();
    const tasks = await prisma.task.findMany({ 
        include: { 
            course: {
                select: {
                    courseName: true
                }
            } 
        }
    });
    const accounts = await prisma.account.findMany();
    const sessions = await prisma.session.findMany();

    return NextResponse.json({ users, courses, tasks, accounts, sessions });
  } catch (error) {
    console.error("Could not fetch data", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Could not fetch data", error: message }, { status: 500 });
  }
}