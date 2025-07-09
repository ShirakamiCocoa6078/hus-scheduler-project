"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Save, AlertCircle, ExternalLink, Smartphone, Monitor, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MoodleSyncPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [moodleUrl, setMoodleUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!moodleUrl.includes("https://moodle.hus.ac.jp/calendar/export_execute.php")) {
            toast({
                variant: "destructive",
                title: "無効なURLです",
                description: "有効なMoodleカレンダーエクスポートURLを入力してください。",
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/settings/moodle-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moodleUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'URLの保存に失敗しました。');
            }

            toast({
                title: "保存しました",
                description: "MoodleカレンダーのURLが正常に保存されました。",
            });
            router.push('/dashboard');
        } catch (error) {
            const message = error instanceof Error ? error.message : "不明なエラーが発生しました。";
            toast({
                variant: "destructive",
                title: "保存エラー",
                description: message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary flex items-center">
                        <Calendar className="mr-3 h-7 w-7" />
                        Moodleカレンダー連携
                    </CardTitle>
                    <CardDescription>
                        Moodleから課題やイベントを自動的にインポートするには、カレンダーのURLを登録してください。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold text-lg">カレンダーURLの取得方法</h3>
                        <Tabs defaultValue="pc" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="pc"><Monitor className="mr-2 h-4 w-4"/>PC版</TabsTrigger>
                                <TabsTrigger value="mobile"><Smartphone className="mr-2 h-4 w-4"/>モバイル版</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pc" className="mt-4">
                                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                                    <li>
                                        <Link href="https://moodle.hus.ac.jp/calendar/view.php" target="_blank" className="text-primary hover:underline inline-flex items-center">
                                            Moodleカレンダー <ExternalLink className="ml-1 h-4 w-4" />
                                        </Link>
                                        にアクセスし、ページ下部にある「カレンダーのエクスポート」ボタンをクリックします。
                                    </li>
                                    <li>「すべてのイベント」を選択し、「カスタム期間」または「最近および今後60日間のイベント」を選択します。</li>
                                    <li>「カレンダーURLを取得する」ボタンをクリックし、表示されたURLをコピーします。</li>
                                    <li>下の入力欄にコピーしたURLを貼り付け、「保存」ボタンをクリックしてください。</li>
                                </ol>
                                <Image 
                                    src="https://placehold.co/600x300.png"
                                    alt="PCでのMoodleカレンダーエクスポート手順"
                                    width={600} height={300}
                                    className="mt-4 rounded-md mx-auto"
                                    data-ai-hint="screenshot tutorial"
                                />
                            </TabsContent>
                            <TabsContent value="mobile" className="mt-4">
                                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                                    <li>モバイルアプリまたはブラウザでMoodleにログインします。</li>
                                    <li>カレンダー機能に移動します。</li>
                                    <li>カレンダーのエクスポートまたは共有オプションを探します。（UIはバージョンによって異なります）</li>
                                    <li>「すべてのイベント」と適切な期間を選択し、生成されたURLをコピーします。</li>
                                    <li>下の入力欄にコピーしたURLを貼り付け、「保存」ボタンをクリックしてください。</li>
                                </ol>
                                 <Image 
                                    src="https://placehold.co/300x500.png"
                                    alt="モバイルでのMoodleカレンダーエクスポート手順"
                                    width={300} height={500}
                                    className="mt-4 rounded-md mx-auto"
                                    data-ai-hint="mobile screenshot"
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="moodle-url" className="font-medium">MoodleカレンダーエクスポートURL</Label>
                        <Input 
                            id="moodle-url" 
                            placeholder="https://moodle.hus.ac.jp/calendar/export_execute.php?..."
                            value={moodleUrl}
                            onChange={(e) => setMoodleUrl(e.target.value)}
                        />
                    </div>
                    
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>注意</AlertTitle>
                        <AlertDescription>
                            登録されたURLは定期的に同期され、新しい課題やイベントが自動的にタスク一覧に追加されます。URLは他人に漏洩しないように注意してください。
                        </AlertDescription>
                    </Alert>

                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        保存
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
