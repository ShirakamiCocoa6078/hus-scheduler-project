
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Database, ServerCrash, User as UserIcon } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Represents a subset of the Prisma User model for display
interface DisplayUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
  onboardingData?: { completed?: boolean } | null;
}

export default function DevAdminPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/get-temp-data");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "データの取得に失敗しました。");
      }
      const data: DisplayUser[] = await response.json();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(message);
      toast({
        title: "エラー",
        description: `データ取得失敗: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Database className="mr-3 h-8 w-8" />
          開発者用データベース閲覧
        </h1>
        <Button variant="outline" asChild>
          <Link href="/login">ログインページへ戻る</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          データベースから直接取得した現在のユーザーデータです。(読み取り専用)
        </p>
        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          再読み込み
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">データを読み込み中...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-80 text-destructive">
            <ServerCrash className="h-12 w-12" />
            <p className="mt-4 font-semibold">データの読み込みに失敗しました</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <Table>
            <TableCaption>
              {users.length > 0 ? `${users.length}人のユーザーが見つかりました。` : "データベースにユーザーがいません。"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">User</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Onboarded</TableHead>
                <TableHead className="w-[280px]">User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{user.name ?? "N/A"}</TableCell>
                  <TableCell>{user.email ?? "N/A"}</TableCell>
                  <TableCell className="text-center">
                    {user.onboardingData?.completed === true ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )}
                  </TableCell>
                   <TableCell className="font-mono text-xs">{user.id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
       <div className="mt-8 p-4 border border-accent bg-accent/10 rounded-md">
        <h3 className="text-md font-semibold text-accent mb-2">Prisma Userモデルのヒント:</h3>
        <pre className="text-xs bg-card p-2 rounded overflow-x-auto">
{`model User {
  id              String    @id @default(cuid())
  name            String?
  email           String?   @unique
  emailVerified   DateTime?
  image           String?
  onboardingData  Json?     // Custom field for app data
  accounts        Account[]
  sessions        Session[]
}`}
        </pre>
         <p className="text-xs text-muted-foreground mt-2">
            このページはUserモデルのデータを表示しています。関連するAccountやSessionモデルのデータは含まれていません。
          </p>
      </div>
    </div>
  );
}
