
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, LogIn, LogOut, UserCircle } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }

  if (status === "unauthenticated") {
    return (
      <Button onClick={() => signIn(undefined, { callbackUrl: '/login' })} variant="outline">
        <LogIn className="mr-2 h-4 w-4" /> ログイン
      </Button>
    );
  }

  if (status === "authenticated" && session?.user) {
    const user = session.user;
    const initials = user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || <UserCircle className="h-5 w-5" />;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "ユーザーアバター"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* ここにプロフィールや設定などの項目を追加できます */}
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>ログアウト</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null; 
}
