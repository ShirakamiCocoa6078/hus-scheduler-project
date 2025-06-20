
// src/app/api/signup/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
// import bcrypt from 'bcryptjs'; // 本番環境ではパスワードハッシュ化に必要

const tempDataPath = path.join(process.cwd(), 'src', 'lib', 'tempData.json');

interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string; // 開発用：平文パスワード
  image?: string | null;
  onboardingData?: {
    department?: string;
    homeStation?: string;
    universityStation?: string;
    syncMoodle?: boolean;
    completed?: boolean;
  };
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(tempDataPath, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error) {
    // ファイルが存在しない場合は空の配列を返し、後で作成されるようにする
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error; // その他のエラーはスローする
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(tempDataPath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ message: '必須項目が不足しています。' }, { status: 400 });
    }

    // メールアドレスの形式を検証 (簡易的)
    if (!email.includes('@') || !email.endsWith("stu.hus.ac.jp")) {
        return NextResponse.json({ message: '有効なHUS大学のメールアドレスを入力してください (@stu.hus.ac.jp)。' }, { status: 400 });
    }
    
    // パスワードの強度を検証 (簡易的)
    if (password.length < 8) {
        return NextResponse.json({ message: 'パスワードは8文字以上である必要があります。' }, { status: 400 });
    }


    const users = await getUsers();

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json({ message: 'このメールアドレスは既に使用されています。' }, { status: 409 });
    }

    // const hashedPassword = await bcrypt.hash(password, 10); // 本番用
    const newUser: User = {
      id: Date.now().toString(), // 簡単なID生成
      name: name,
      email: email,
      password: password, // 開発用：平文パスワード
      onboardingData: { completed: false }, // オンボーディングは未完了で初期化
    };

    users.push(newUser);
    await saveUsers(users);

    return NextResponse.json({ message: 'ユーザー登録が成功しました。' }, { status: 201 });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
