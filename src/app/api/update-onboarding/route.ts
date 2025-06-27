
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OnboardingData {
  department?: string;
  homeStation?: string;
  universityStation?: string;
  completed?: boolean;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const onboardingDataFromRequest = await request.json() as Omit<OnboardingData, 'completed'>;
    
    // Find the user in the database
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ message: 'ユーザーが見つかりません。' }, { status: 404 });
    }

    // Merge existing data with new data and set completed to true
    const existingOnboardingData = (currentUser as any).onboardingData || {};
    const newOnboardingData = {
      ...existingOnboardingData,
      ...onboardingDataFromRequest,
      completed: true,
    };
    
    // Update the user's onboardingData in the database
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        onboardingData: newOnboardingData,
      },
    });

    return NextResponse.json({ message: 'オンボーディング情報が更新されました。', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('オンボーディング更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
