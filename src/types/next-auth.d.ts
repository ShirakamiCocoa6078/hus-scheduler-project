
import type { DefaultSession, User as NextAuthUser } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

// オンボーディングデータの型定義
interface OnboardingData {
  department?: string;
  homeStation?: string;
  universityStation?: string;
  completed?: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingData?: OnboardingData;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  // NextAuth.User型を拡張してidとonboardingDataを含める
  interface User extends NextAuthUser {
    id: string; // ユーザーIDを必須にする
    onboardingData?: OnboardingData; // オンボーディングデータをオプションで追加
  }
}

declare module "next-auth/jwt" {
  // JWT型を拡張してidとonboardingDataを含める
  interface JWT extends NextAuthJWT {
    id: string;
    onboardingData?: OnboardingData;
    accessToken?: string; // 既存のaccessTokenも維持
  }
}
