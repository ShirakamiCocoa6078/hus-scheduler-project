
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: '認証されていません。' }, { status: 401 });
  }

  try {
    const dataFromRequest = await request.json();
    
    // Update the user's onboardingData and set isSetupComplete to true
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingData: dataFromRequest,
        isSetupComplete: true,
      },
    });

    return NextResponse.json({ message: 'オンボーディング情報が更新されました。', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('オンボーディング更新エラー:', error);
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました。';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
