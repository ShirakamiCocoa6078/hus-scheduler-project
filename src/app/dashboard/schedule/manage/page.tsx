"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { BookmarkPlus, AlertCircle, Copy } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// The bookmarklet now simply injects an external script. This is more maintainable.
// Added a timestamp to prevent caching issues with the script.
const bookmarkletCode = `javascript:(function(){var s=document.createElement('script');s.src='https://hus-scheduler-project.vercel.app/js/unipa-importer.js?t='+new Date().getTime();document.body.appendChild(s);})();`;

export default function ScheduleManagePage() {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    toast({
      title: "コピーしました",
      description: "JavaScriptコードがクリップボードにコピーされました。",
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <BookmarkPlus className="mr-3 h-7 w-7" />
            UNIPA 時間割インポート設定
          </CardTitle>
          <CardDescription>
            ブックマークレットを使用して、UNIPAから時間割を一度にインポートします。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-lg">ブックマークレットの作成手順</h3>
            <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li>
                下のコードボックスの<strong>「コードコピー」</strong>ボタンを押し、JavaScriptコードをコピーします。
              </li>
              <li>
                お使いのブラウザで新しいブックマークを作成し、以下の情報を入力します。<br/>
                <ul className="list-disc list-inside ml-4 my-2 p-3 bg-background rounded-md text-foreground">
                  <li><strong>名前 (Name):</strong> 「UNIPA時間割インポート」など、分かりやすい名前</li>
                  <li><strong>URL (アドレス):</strong> <strong>そのまま貼り付け</strong>ます。（`javascript:`から始まるコード全体）</li>
                </ul>
              </li>
              <li>
                保存したブックマークレットは、ブラウザのブックマークバーに表示されます。
              </li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookmarklet-code" className="font-medium">ステップ1: 以下のコードをコピー</Label>
            <div className="relative">
              <pre className="p-4 pr-20 bg-muted rounded-md text-sm overflow-x-auto">
                <code id="bookmarklet-code">{bookmarkletCode}</code>
              </pre>
              <Button onClick={handleCopy} size="sm" className="absolute top-2 right-2">
                <Copy className="mr-2 h-4 w-4" />
                コピー
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>実行方法</AlertTitle>
            <AlertDescription>
              UNIPAにログイン後、ブックマークバーに追加した「UNIPA時間割インポート」をクリックしてください。
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
}
