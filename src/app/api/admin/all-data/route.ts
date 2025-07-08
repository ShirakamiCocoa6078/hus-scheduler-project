// /api/admin/all-data/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // In a real app, add admin-only authentication/authorization checks here.
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    if (userId) {
      // Fetch data for a specific user
      const courses = await prisma.course.findMany({
        where: { userId },
        orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
      });
      const tasks = await prisma.task.findMany({
        where: { userId },
        include: { course: { select: { courseName: true } } },
        orderBy: { dueDate: 'asc' },
      });
      return NextResponse.json({ courses, tasks });
    } else {
      // Fetch all data (original behavior)
      const users = await prisma.user.findMany();
      const courses = await prisma.course.findMany();
      const tasks = await prisma.task.findMany({
        include: { course: { select: { courseName: true } } },
      });
      const accounts = await prisma.account.findMany();
      const sessions = await prisma.session.findMany();
      return NextResponse.json({ users, courses, tasks, accounts, sessions });
    }
  } catch (error) {
    console.error("Could not fetch data for admin", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Could not fetch data", error: message }, { status: 500 });
  }
}
