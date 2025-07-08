'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save, BookMarked, ExternalLink, FileCode, AlertCircle, BookmarkPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Label } from "@/components/ui/label"; 

export default function ScheduleManagePage() {
  const { toast } = useToast();
  
  const bookmarkletCode = `javascript:(function(){try{let e=[],t=document.querySelector("#funcForm\\\\:j_idt387\\\\:j_idt3700");if(t){let o=t.querySelectorAll(".ui-datalist-item .lessonArea");o.length>0&&(e=Array.from(o).map(e=>{let[t,o]= (e.querySelector(".period")?.innerText.trim()||"").split(" "),r=e.querySelector(".lessonDetail a")?.innerText.trim()||"",s=e.querySelector(".lessonDetail > div:last-child")?.innerText.trim()||"",l=e.querySelector(".lessonTitle")?.innerText.trim()||"",c=e.querySelector('a[title*="授業評価アンケート"]'),n=c?new URL(c.href).searchParams.get("id"):null;return{dayOfWeek:t,period:o,courseName:l,professor:r,location:s,moodleCourseId:n}}))}if(0===e.length){let t=document.querySelector(".dateDisp")?.innerText.trim()||"",o=t.match(/\\((月|火|水|木|金|土|日)\\)/);if(o){let t=o[1],r=document.querySelectorAll("#portalSchedule2 .lessonArea"),s={"09:00":"1","10:40":"2","13:00":"3","14:40":"4","16:20":"5","18:00":"6"};e=Array.from(r).map(e=>{let o=e.querySelector(".lessonHead p").innerText.trim().replace(/\\s*-\\s*/g,"-"),r=o.match(/(\\d{2}:\\d{2})-(\\d{2}:\\d{2})/),l=e.querySelector(".lessonHead .period")?.innerText.match(/([1-6])/),c=l?l[1]:r?s[r[1]]:null,n=e.querySelector(".lessonDetail a")?.innerText.trim()||"",a=e.querySelector(".lessonDetail > div:last-child")?.innerText.trim()||"",i=e.querySelector(".lessonTitle")?.innerText.trim()||"",d=e.querySelector('a[title*="授業評価アンケート"]'),u=d?new URL(d.href).searchParams.get("id"):null;return{dayOfWeek:t,period:c,courseName:i,professor:n,location:a,moodleCourseId:u}}).filter(e=>e.period)}}if(0===e.length)throw new Error("時間割情報が見つかりません。「履修授業一覧」または「日表示」タブで実行してください。");let r=JSON.stringify(e),s=btoa(encodeURIComponent(r)),l=\`https://hus-scheduler-project.vercel.app/dashboard/schedule/import?data=\${s}\`;alert(\`合計\${e.length}件の授業情報をインポートします。\`),window.open(l,"_blank")}catch(e){alert("エラー: "+e.message),console.error(e)}})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      toast({
        title: "コピーしました！",
        description: "ブックマークのURL欄に貼り付けてください。",
      });
    }, () => {
      toast({
        title: "コピー失敗",
        description: "クリップボードへのコピーに失敗しました。",
        variant: "destructive",
      });
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
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">ブックマークレットの作成手順</h3>
            <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
              <li>
                下のコードボックスの<strong>「コードコピー」</strong>ボタンを押し、JavaScriptコードをコピーします。
              </li>
              <li>
                お使いのブラウザで新しいブックマークを作成し、以下の情報を入力します。<br/>
                <ul className="list-disc list-inside ml-4 my-2 p-3 bg-muted rounded-md text-foreground">
                  <li><strong>名前 (Name):</strong> 「UNIPA時間割インポート」など、分かりやすい名前</li>
                  <li><strong>URL (アドレス):</strong> <strong>javascript:</strong> と入力した後、先ほどコピーしたコードを<strong>そのまま貼り付け</strong>ます。</li>
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
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code id="bookmarklet-code">{bookmarkletCode}</code>
              </pre>
              <Button onClick={handleCopy} size="sm" className="absolute top-2 right-2">コピー</Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>実行方法</AlertTitle>
            <AlertDescription>
                <div className="space-y-2">
                    <p>
                        UNIPAにログイン後、「履修授業一覧」または「日表示」ページを開き、ブックマークバーに追加した「UNIPA時間割インポート」をクリックしてください。
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <a href="https://unipa.hus.ac.jp/uprx/" target="_blank" rel="noopener noreferrer">
                            HUS-UNIPAを開く
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </AlertDescription>
          </Alert>
        </CardContent>
         <CardFooter>
             <Button variant="outline" asChild>
                <Link href="/dashboard">ダッシュボードに戻る</Link>
             </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
