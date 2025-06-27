
// src/app/api/delete-account/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    // Find the user first to ensure they exist before attempting deletion.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      console.warn(`削除試行エラー: ユーザーID ${session.user.id} が見つかりませんでした。`);
      return NextResponse.json({ message: '削除対象のユーザーが見つかりませんでした。' }, { status: 404 });
    }
    
    // Delete the user from the database
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ message: 'アカウントが正常に削除されました。' }, { status: 200 });
  } catch (error) {
    console.error('アカウント削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
