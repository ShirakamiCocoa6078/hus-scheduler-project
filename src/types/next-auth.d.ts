// src/types/next-auth.d.ts
import type { DefaultSession, User as NextAuthUser } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

// 통학 경로 계획 타입 정의
interface CommutePlan {
  primaryMode?: 'jr' | 'subway' | 'bus' | 'bicycle' | 'walk';
  startPoint?: string; // 역 이름 또는 주소
  transferMode?: 'bus' | 'walk' | 'bicycle'; // 환승 수단
}

// 온보딩 데이터의 타입 정의
interface OnboardingData {
  department?: string;
  commutePlan?: CommutePlan;
}

// Course 타입을 앱 전체에서 재사용할 수 있도록 export
export interface Course {
  id: string;
  courseName: string;
  // 필요에 따라 다른 필드 추가 가능
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingData?: OnboardingData;
      isSetupComplete?: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  // NextAuth.User형을 확장하여 id와 onboardingData를 포함
  interface User extends NextAuthUser {
    id: string; // 사용자 ID를 필수로 설정
    onboardingData?: OnboardingData; // 온보딩 데이터를 옵션으로 추가
    isSetupComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  // JWT 타입을 확장하여 id와 onboardingData를 포함
  interface JWT extends NextAuthJWT {
    id: string;
    onboardingData?: OnboardingData;
    isSetupComplete?: boolean;
    accessToken?: string; // 기존의 accessToken도 유지
  }
}
