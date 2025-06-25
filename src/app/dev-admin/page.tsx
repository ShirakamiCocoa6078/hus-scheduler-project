
// src/app/dev-admin/page.tsx
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
  // password field is intentionally omitted for display
  image?: string | null;
  onboardingData?: {
    department?: string;
    homeStation?: string;
    universityStation?: string;
    completed?: boolean;
  };
}

export default function DevAdminPage() {
  const [usersData, setUsersData] = useState<User[]>([]);
  const [editableData, setEditableData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      setEditableData(JSON.stringify(data, null, 2));
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(editableData);
      } catch (e) {
        toast({
          title: "保存エラー",
          description: "JSON形式が無効です。内容を確認してください。",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      const response = await fetch("/api/get-temp-data", { // POSTリクエストも同じエンドポイントを使用
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData), // パースされたデータを送信
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || "データの保存に失敗しました。");
      }
      
      toast({
        title: "成功",
        description: "データが正常に保存されました。",
      });
      await fetchData(); // 保存後にデータを再取得して表示を更新
    } catch (error) {
      const message = error instanceof Error ? error.message : "不明なエラーが発生しました。";
      toast({
        title: "エラー",
        description: `データ保存失敗: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">開発者用データ管理</h1>
        <Button variant="outline" asChild>
          <Link href="/login">ログインページへ戻る</Link>
        </Button>
      </div>
      
      <div className="mb-4 p-4 border border-destructive bg-destructive/10 rounded-md">
        <h2 className="text-lg font-semibold text-destructive mb-2">注意</h2>
        <p className="text-sm text-destructive-foreground">
          このページは開発およびテスト目的専用です。ここでの変更は、アプリケーションの基盤となる <code className="bg-destructive/20 px-1 rounded">tempData.json</code> ファイルに直接影響します。
          誤った変更はアプリケーションの誤動作を引き起こす可能性があります。取り扱いには十分注意してください。
          <strong>パスワードフィールドはセキュリティのため表示されません。</strong>
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
            <Label htmlFor="jsonData" className="text-lg font-medium">tempData.json の内容:</Label>
            <Textarea
              id="jsonData"
              value={editableData}
              onChange={(e) => setEditableData(e.target.value)}
              rows={25}
              className="mt-2 p-3 font-mono text-sm bg-card border-border rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="JSONデータをここに表示・編集..."
            />
             <p className="text-xs text-muted-foreground mt-1">
              ここで編集した内容は下の「保存」ボタンで <code className="text-xs">tempData.json</code> に反映されます。
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              保存
            </Button>
            <Button onClick={fetchData} variant="outline" disabled={isLoading || isSaving}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              再読み込み
            </Button>
          </div>
        </div>
      )}
       <div className="mt-8 p-4 border border-accent bg-accent/10 rounded-md">
        <h3 className="text-md font-semibold text-accent mb-2">データ構造のヒント:</h3>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`[
  {
    "id": "ユニークID",
    "name": "ユーザー名",
    "email": "メールアドレス",
    // "password": "平文パスワード（開発用、ここには表示されません）",
    "image": "画像URL (オプション)",
    "onboardingData": {
      "department": "学部",
      "homeStation": "最寄駅",
      "universityStation": "大学の最寄駅",
      "completed": true/false // オンボーディング完了フラグ
    }
  },
  // ...他のユーザー
]`}
        </pre>
      </div>
    </div>
  );
}
