'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, PlusCircle, Save, BookMarked, ExternalLink, FileCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Label as FormLabel } from "@/components/ui/label"; 

interface Course {
  courseName: string;
  dayOfWeek: number;
  period: number;
  location: string;
}

const dayOfWeekMap: { [key: number]: string } = { 1: '月曜', 2: '火曜', 3: '水曜', 4: '木曜', 5: '金曜', 6: '土曜', 0: '日曜' };

// --- Reusable Editable Table Component (Refactored to list) ---
function EditableScheduleList({ courses, setCourses }: { courses: Course[], setCourses: React.Dispatch<React.SetStateAction<Course[]>> }) {

  const handleCourseChange = (index: number, field: keyof Course, value: string | number) => {
    const newCourses = [...courses];
    (newCourses[index] as any)[field] = value;
    setCourses(newCourses);
  };

  const addCourse = () => {
    setCourses([...courses, { courseName: '', dayOfWeek: 1, period: 1, location: '' }]);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
       <div className="space-y-6">
        {courses.map((course, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end p-4 border rounded-lg relative bg-background">
            <div className="space-y-1 col-span-1 md:col-span-3">
              <FormLabel htmlFor={`courseName-${index}`}>授業名</FormLabel>
              <Input id={`courseName-${index}`} value={course.courseName} onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)} placeholder="例: 情報科学" />
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <FormLabel htmlFor={`dayOfWeek-${index}`}>曜日</FormLabel>
              <Select value={String(course.dayOfWeek)} onValueChange={(value) => handleCourseChange(index, 'dayOfWeek', Number(value))}>
                <SelectTrigger id={`dayOfWeek-${index}`}><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(dayOfWeekMap).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <FormLabel htmlFor={`period-${index}`}>時限</FormLabel>
              <Select value={String(course.period)} onValueChange={(value) => handleCourseChange(index, 'period', Number(value))}>
                <SelectTrigger id={`period-${index}`}><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5, 6].map(p => <SelectItem key={p} value={String(p)}>{p}時限</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-1 md:col-span-2">
              <FormLabel htmlFor={`location-${index}`}>教室</FormLabel>
              <Input id={`location-${index}`} value={course.location} onChange={(e) => handleCourseChange(index, 'location', e.target.value)} placeholder="例: G201" />
            </div>
            <div className="col-span-1 flex justify-end">
               <Button variant="ghost" size="icon" onClick={() => removeCourse(index)} className="absolute top-2 right-2 md:relative md:top-auto md:right-auto" aria-label="Remove course">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" onClick={addCourse}><PlusCircle className="mr-2 h-4 w-4" />授業を追加</Button>
    </div>
  );
}

// --- Import from Bookmarklet Tab ---
function ImportTabContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const bookmarkletCode = `javascript:(function(){var s=document.createElement("script");s.src="https://hus-scheduler-project.vercel.app/js/unipa-importer.js";document.body.appendChild(s);})();`;

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedString = decodeURIComponent(atob(data));
        const parsedCourses = JSON.parse(decodedString);
        if (Array.isArray(parsedCourses)) {
          setCourses(parsedCourses);
        } else {
          throw new Error('無効なデータ形式です。');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'データの解析に失敗しました。';
        setError(message);
        toast({ title: 'エラー', description: message, variant: 'destructive' });
      }
    }
    setIsLoading(false);
  }, [searchParams, toast]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      toast({ title: "コピーしました！", description: "ブックマークのURL欄に貼り付けてください。" });
    }, () => {
      toast({ title: "コピー失敗", description: "クリップボードへのコピーに失敗しました。", variant: "destructive" });
    });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/courses/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courses),
      });
      if (!response.ok) throw new Error('保存中にエラーが発生しました。');
      toast({ title: '成功', description: '時間割が正常に保存されました。' });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: '保存エラー', description: error instanceof Error ? error.message : '不明なエラー', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && <Alert variant="destructive"><AlertTitle>エラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><BookMarked className="h-7 w-7 text-accent" />1. ブックマークレットの準備</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">※ 既に「時間割インポート」ブックマークレットを登録している方は次のステップへ進んでください。</p>
          <div>
            <p className="font-semibold">ステップ1: 下のボタンをブックマークバーにドラッグ＆ドロップしてください。</p>
            <div className="mt-2"><Button asChild variant="secondary"><a href={bookmarkletCode} onClick={(e) => e.preventDefault()}>時間割インポート</a></Button></div>
          </div>
          <div>
            <p className="font-semibold">ステップ2: (ドラッグできない場合) 下のJavaScriptコードをコピーし、手動でブックマークを作成してください。</p>
            <div className="mt-2 p-4 bg-muted rounded-md relative font-mono text-sm">
              <pre className="overflow-x-auto pr-16"><code>{bookmarkletCode}</code></pre>
              <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={copyToClipboard}><FileCode className="h-4 w-4" /><span className="sr-only">Copy code</span></Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-3 text-2xl"><ExternalLink className="h-7 w-7 text-accent" />2. 時間割データの登録・更新</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><p><strong className="text-primary">ステップ1:</strong> 下のボタンをクリックして、新しいタブでHUS-UNIPAを開き、ログインしてください。</p><Button asChild><a href="https://unipa.hus.ac.jp/uprx/" target="_blank" rel="noopener noreferrer">HUS-UNIPAを開く<ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>
          <p><strong className="text-primary">ステップ2:</strong> ログイン後、時間割が表示されているページ（履修授業一覧など）へ移動してください。</p>
          <p><strong className="text-primary">ステップ3:</strong> ブラウザのブックマークバーから、準備しておいた「時間割インポート」ブックマークレットをクリックします。</p>
          <p><strong className="text-primary">ステップ4:</strong> 確認ダイアログで「OK」をクリックすると、このページに時間割データが読み込まれます。</p>
        </CardContent>
      </Card>

      {courses.length > 0 && (
        <Card>
          <CardHeader><CardTitle>インポートされたデータの確認・修正</CardTitle><CardDescription>内容を確認し、必要であれば修正してください。</CardDescription></CardHeader>
          <CardContent><EditableScheduleList courses={courses} setCourses={setCourses} /></CardContent>
          <CardFooter><Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}保存して完了</Button></CardFooter>
        </Card>
      )}
    </div>
  );
}

// --- Direct Edit Tab ---
function DirectEditTabContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/courses/all');
        if (!response.ok) throw new Error('時間割データの読み込みに失敗しました。');
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        toast({ title: 'エラー', description: error instanceof Error ? error.message : '不明なエラー', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/courses/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(courses),
      });
      if (!response.ok) throw new Error('保存中にエラーが発生しました。');
      toast({ title: '成功', description: '時間割が正常に保存されました。' });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: '保存エラー', description: error instanceof Error ? error.message : '不明なエラー', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader><CardTitle>時間割の直接編集</CardTitle><CardDescription>現在の時間割です。自由に変更、追加、削除してください。</CardDescription></CardHeader>
      <CardContent>
        {isLoading ? (<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>) : (<EditableScheduleList courses={courses} setCourses={setCourses} />)}
      </CardContent>
      <CardFooter><Button onClick={handleSave} disabled={isSaving || isLoading}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}変更を保存</Button></CardFooter>
    </Card>
  );
}

// --- Main Page Component ---
function ManageScheduleComponent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'import';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline text-primary">時間割の管理</h1>
        <p className="mt-2 text-muted-foreground">
            ブックマークレットを使って大学のポータルサイトから時間割をインポートするか、手動で直接編集することができます。
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">ブックマークレットでインポート</TabsTrigger>
          <TabsTrigger value="edit">直接編集</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-6">
          <ImportTabContent />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <DirectEditTabContent />
        </TabsContent>
      </Tabs>
       <div className="mt-8">
          <Button variant="outline" asChild>
              <Link href="/dashboard">ダッシュボードに戻る</Link>
          </Button>
       </div>
    </div>
  );
}

export default function ManageSchedulePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
            <ManageScheduleComponent />
        </Suspense>
    )
}
