
// src/app/api/delete-account/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const tempDataPath = path.join(process.cwd(), 'src', 'lib', 'tempData.json');

interface User {
  id: string;
  name?: string | null;
  email: string;
  // 他のフィールド...
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(tempDataPath, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error("tempData.jsonの読み取りに失敗:", error);
    throw new Error("ユーザーデータの読み取りに失敗しました。");
  }
}

async function saveUsers(users: User[]): Promise<void> {
  try {
    await fs.writeFile(tempDataPath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error("tempData.jsonへの書き込みに失敗:", error);
    // エラーを再スローして、呼び出し元のAPIハンドラでキャッチできるようにします。
    // これにより、クライアントに明確なエラーが返されます。
    throw new Error("ユーザーデータの保存に失敗しました。サーバーレス環境ではファイル書き込みができない場合があります。");
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const users = await getUsers();
    const updatedUsers = users.filter(u => u.id !== session.user?.id);

    if (users.length === updatedUsers.length) {
      // この状況は、ユーザーが既に削除されているがセッションが残っている場合などに発生する可能性があります。
      console.warn(`削除試行エラー: ユーザーID ${session.user.id} が見つかりませんでした。`);
      return NextResponse.json({ message: '削除対象のユーザーが見つかりませんでした。' }, { status: 404 });
    }

    await saveUsers(updatedUsers);

    return NextResponse.json({ message: 'アカウントが正常に削除されました。' }, { status: 200 });
  } catch (error) {
    console.error('アカウント削除エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
