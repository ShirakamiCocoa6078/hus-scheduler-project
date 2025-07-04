
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookMarked, FileCode, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ManageSchedulePage() {
  const { toast } = useToast();
  const bookmarkletCode = `javascript:(function(){const s=document.createElement("script");s.src="https://hus-scheduler-project.vercel.app/js/unipa-importer.js";document.body.appendChild(s);})();`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      toast({
        title: "コピーしました！",
        description: "ブックマークのURL欄に貼り付けてください。",
      });
    }, (err) => {
      toast({
        title: "コピー失敗",
        description: "クリップボードへのコピーに失敗しました。",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-headline text-primary">時間割のインポート方法</h1>
            <p className="mt-2 text-muted-foreground">
                「本日のスケジュール」機能を利用するには、大学のポータルサイト「HUS-UNIPA」からご自身の時間割データを取得し、HUS-schedulerに反映させる必要があります。
            </p>
             <p className="mt-1 text-muted-foreground">
                この作業は学期の初めなど、時間割が更新された際に行ってください。
            </p>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <BookMarked className="h-7 w-7 text-accent" />
                        1. ブックマークレットの準備
                    </CardTitle>
                    <CardDescription>
                        ※ 既に「時間割インポート」ブックマークレットを登録している方は次のステップへ進んでください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="font-semibold">ステップ1: 下のボタンをブックマークバーにドラッグ＆ドロップしてください。</p>
                         <div className="mt-2">
                            <Button asChild variant="secondary">
                                <a href={bookmarkletCode} onClick={(e) => e.preventDefault()}>
                                    時間割インポート
                                </a>
                            </Button>
                        </div>
                    </div>
                     <div>
                        <p className="font-semibold">ステップ2: (ドラッグできない場合) 下のJavaScriptコードをコピーし、手動でブックマークを作成してください。</p>
                        <div className="mt-2 p-4 bg-muted rounded-md relative font-mono text-sm">
                            <pre className="overflow-x-auto pr-16"><code>{bookmarkletCode}</code></pre>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={copyToClipboard}
                            >
                                <FileCode className="h-4 w-4" />
                                <span className="sr-only">Copy code</span>
                            </Button>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                           ブックマークの名前は「時間割インポート」など、分かりやすいものに設定してください。
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <ExternalLink className="h-7 w-7 text-accent" />
                        2. 時間割データの登録・更新
                    </CardTitle>
                    <CardDescription>
                        準備したブックマークレットを使って、時間割をインポートします。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <p><strong className="text-primary">ステップ1:</strong> 下のボタンをクリックして、新しいタブでHUS-UNIPAを開き、ログインしてください。</p>
                        <Button asChild>
                            <a href="https://unipa.hus.ac.jp/uprx/" target="_blank" rel="noopener noreferrer">
                                HUS-UNIPAを開く
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                    <p><strong className="text-primary">ステップ2:</strong> ログイン後、時間割が表示されているページ（履修授業一覧など）へ移動してください。</p>
                    <p><strong className="text-primary">ステップ3:</strong> ブラウザのブックマークバーから、準備しておいた「時間割インポート」ブックマークレットをクリックします。</p>
                    <p><strong className="text-primary">ステップ4:</strong> 画面に「時間割情報をHUS-schedulerに転送しますか？」という確認画面が表示されたら、「はい、転送する」をクリックします。</p>
                    <p><strong className="text-primary">ステップ5:</strong> 処理が完了すると、自動的に時間割の確認ページに移動します。内容を確認・修正し、「保存して完了」ボタンを押してください。</p>
                </CardContent>
            </Card>
        </div>
        
        <div className="mt-8">
            <Button variant="outline" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ダッシュボードに戻る
                </Link>
            </Button>
        </div>
    </div>
  );
}
