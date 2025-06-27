
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  onboardingData?: any;
}

export default function DevAdminPage() {
  const [usersData, setUsersData] = useState<User[]>([]);
  const [displayData, setDisplayData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/get-temp-data");
      if (!response.ok) {
        throw new Error("データの取得に失敗しました。");
      }
      const data: User[] = await response.json();
      setUsersData(data);
      setDisplayData(JSON.stringify(data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "不明なエラーが発生しました。";
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
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">開発者用データ閲覧</h1>
        <Button variant="outline" asChild>
          <Link href="/login">ログインページへ戻る</Link>
        </Button>
      </div>
      
      <div className="mb-4 p-4 border border-destructive bg-destructive/10 rounded-md">
        <h2 className="text-lg font-semibold text-destructive mb-2">注意</h2>
        <p className="text-sm text-destructive-foreground">
          このページは開発およびデバッグ目的でデータベースのユーザー情報を表示します。
          現在は <strong>読み取り専用</strong> であり、ここからデータを変更することはできません。
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">データを読み込み中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="jsonData" className="text-lg font-medium">ユーザーデータベースの内容:</Label>
            <Textarea
              id="jsonData"
              value={displayData}
              readOnly
              rows={25}
              className="mt-2 p-3 font-mono text-sm bg-card border-border rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="ユーザーデータがここに表示されます..."
            />
             <p className="text-xs text-muted-foreground mt-1">
              データは読み取り専用です。
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchData} variant="outline" disabled={isLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              再読み込み
            </Button>
          </div>
        </div>
      )}
       <div className="mt-8 p-4 border border-accent bg-accent/10 rounded-md">
        <h3 className="text-md font-semibold text-accent mb-2">Prisma Userモデルのヒント:</h3>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
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
      </div>
    </div>
  );
}
