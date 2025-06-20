
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


const tempDataPath = path.join(process.cwd(), 'src', 'lib', 'tempData.json');

interface OnboardingData {
  department?: string;
  homeStation?: string;
  universityStation?: string;
  syncMoodle?: boolean;
  completed?: boolean;
}

interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string; 
  image?: string | null;
  onboardingData?: OnboardingData;
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(tempDataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error("tempData.jsonの読み取りに失敗:", error);
    throw new Error("ユーザーデータの読み取りに失敗しました。");
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(tempDataPath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const onboardingDataFromRequest = await request.json() as Omit<OnboardingData, 'completed'>;
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.email === session.user?.email);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // 既存のオンボーディングデータとマージし、completedをtrueに設定
    users[userIndex].onboardingData = {
      ...users[userIndex].onboardingData,
      ...onboardingDataFromRequest,
      completed: true, // オンボーディング完了
    };

    await saveUsers(users);

    return NextResponse.json({ message: 'オンボーディング情報が更新されました。', user: users[userIndex] }, { status: 200 });
  } catch (error) {
    console.error('オンボーディング更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
