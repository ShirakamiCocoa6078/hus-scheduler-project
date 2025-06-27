
// src/app/api/signup/route.ts
import { NextResponse, type NextRequest } from 'next/server';

// This endpoint is deprecated as we are moving to Google-only authentication.
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Email/password signup is no longer supported. Please use Google sign-in.' },
    { status: 405 } // Method Not Allowed
  );
}
