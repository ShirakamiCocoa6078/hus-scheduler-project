import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const courseId = params.courseId;
  try {
    const body = await request.json();
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: body,
    });
    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error('Admin Error updating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error updating course', error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const courseId = params.courseId;
  try {
    await prisma.course.delete({
      where: { id: courseId },
    });
    return NextResponse.json({ message: 'Course deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin Error deleting course:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Error deleting course', error: errorMessage }, { status: 500 });
  }
}
