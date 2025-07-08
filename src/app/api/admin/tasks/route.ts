import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // In a real app, validate body contents with Zod
    if (body.dueDate) {
        body.dueDate = new Date(body.dueDate);
    }
    const newTask = await prisma.task.create({
      data: body,
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Admin Error creating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error creating task', error: errorMessage }, { status: 500 });
  }
}
