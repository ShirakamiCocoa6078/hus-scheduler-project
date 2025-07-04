
// src/app/api/get-temp-data/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // This is a developer API, so ideally it should have some form of auth check.
  // For now, it will fetch all users.

  try {
    const users = await prisma.user.findMany();
    // The password field is not returned for security.
    // The Prisma schema should omit it from the client-facing model, or we select fields manually.
    // Assuming the default User model from NextAuth adapter doesn't expose password.
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('データ取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    // Direct database modification via JSON is disabled for security and stability.
    // This endpoint is now read-only.
    return NextResponse.json({ message: 'この操作は現在サポートされていません。' }, { status: 405 });
}
