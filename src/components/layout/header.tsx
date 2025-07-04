
"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { CalendarCheck } from "lucide-react";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center space-x-2" aria-label="ダッシュボードへ移動">
           <CalendarCheck className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-semibold text-primary sm:inline-block">
            HUS-scheduler
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggleButton />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
