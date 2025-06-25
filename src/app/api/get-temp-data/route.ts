
// src/app/api/get-temp-data/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 開発者のみアクセスを想定

const tempDataPath = path.join(process.cwd(), 'src', 'lib', 'tempData.json');

interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string; // 注意：デバッグ用であり、本番では決して公開しないこと
  image?: string | null;
  onboardingData?: {
    department?: string;
    homeStation?: string;
    universityStation?: string;
    completed?: boolean;
  };
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(tempDataPath, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // ファイルが存在しない場合は空の配列を返す
      try {
        await fs.writeFile(tempDataPath, JSON.stringify([], null, 2), 'utf-8');
      } catch (writeError) {
         console.warn("Could not create tempData.json. This is expected in a read-only filesystem.", writeError);
      }
      return [];
    }
    console.error("tempData.jsonの読み取りに失敗:", error);
    // Even if reading fails, return an empty array to avoid crashing.
    return [];
  }
}

export async function GET() {
  // 開発者用APIなので、通常は何らかの認証を挟むべき
  // const session = await getServerSession(authOptions);
  // if (!session || !session.user?.email /* || !isDeveloper(session.user.email) */) {
  //   return NextResponse.json({ message: 'アクセス権がありません。' }, { status: 403 });
  // }

  try {
    const users = await getUsers();
    // 注意：パスワードフィールドは開発目的であってもクライアントに送るべきではありません。
    // ここでは一時的なデータベース管理のデモのため、そのまま返しますが、
    // 実際のアプリケーションではパスワードフィールドを除外する処理が必要です。
    const usersSafeToDisplay = users.map(user => {
        const { password, ...rest } = user; // パスワードを除外
        return rest;
    });
    return NextResponse.json(usersSafeToDisplay, { status: 200 });
  } catch (error) {
    console.error('データ取得エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 開発者用APIなので、通常は何らかの認証を挟むべき
  try {
    const updatedUsers = await request.json();
    // 注意: このAPIは非常に強力なので、厳重なアクセス制御が必要です。
    // ここでは、受け取ったデータでそのままファイルを上書きします。
    // 実際のアプリケーションでは、より細かいバリデーションや権限チェックが必要です。
    try {
      await fs.writeFile(tempDataPath, JSON.stringify(updatedUsers, null, 2), 'utf-8');
    } catch (error) {
        console.warn("Failed to write to tempData.json. This is expected in a serverless environment.", error);
    }
    return NextResponse.json({ message: 'データが更新されました。' }, { status: 200 });
  } catch (error) {
    console.error('データ更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
