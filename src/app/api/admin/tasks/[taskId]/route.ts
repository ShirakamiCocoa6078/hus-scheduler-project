import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const taskId = params.taskId;
  try {
    const body = await request.json();
     // dueDate might be a string, convert to Date object
    if (body.dueDate) {
        body.dueDate = new Date(body.dueDate);
    }
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: body,
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('Admin Error updating task:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error updating task', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const taskId = params.taskId;
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin Error deleting task:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error deleting task', error: errorMessage }, { status: 500 });
  }
}
