import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Could not fetch users for admin", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Could not fetch users", error: message }, { status: 500 });
  }
}
