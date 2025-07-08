import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real app, validate body contents with Zod
    const newCourse = await prisma.course.create({
      data: body,
    });
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Admin Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error creating course', error: errorMessage }, { status: 500 });
  }
}
