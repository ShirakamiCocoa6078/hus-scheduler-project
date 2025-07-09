"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Course 데이터 타입을 명확하게 정의
interface CourseData {
  dayOfWeek: string;
  period: string;
  courseName: string;
  professor: string;
  location: string;
  moodleCourseId?: string | null;
}

function ImportPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        // URL 디코딩 -> Base64 디코딩 -> JSON 파싱
        const decodedJsonString = decodeURIComponent(atob(data));
        const parsedCourses: CourseData[] = JSON.parse(decodedJsonString);

        if (Array.isArray(parsedCourses) && parsedCourses.length > 0) {
          setCourses(parsedCourses);
        } else {
          throw new Error("インポートする授業データが見つかりませんでした。");
        }
      } catch (e) {
        console.error("データのデコードまたは解析に失敗しました:", e);
        setError("無効なデータ形式のため、授業情報を読み込めませんでした。");
      }
    } else {
      setError("インポートするデータがありません。");
    }
    setIsLoading(false);
  }, [searchParams]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/courses/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '時間割の保存に失敗しました。');
      }

      toast({
        title: "成功",
        description: `${courses.length}件の授業が正常に保存されました。ダッシュボードに移動します。`,
      });
      router.push('/dashboard'); 
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      toast({
        title: "保存エラー",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">インポートデータを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">インポート内容の確認</CardTitle>
          <CardDescription>UNIPAから以下の授業データをインポートします。内容を確認し、問題がなければ保存してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>曜日</TableHead>
                  <TableHead>時限</TableHead>
                  <TableHead>授業名</TableHead>
                  <TableHead>担当教員</TableHead>
                  <TableHead>教室</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={index}>
                    <TableCell>{course.dayOfWeek}</TableCell>
                    <TableCell>{course.period}</TableCell>
                    <TableCell className="font-medium">{course.courseName}</TableCell>
                    <TableCell>{course.professor}</TableCell>
                    <TableCell>{course.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              保存する
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Suspense를 사용하여 URL 파라미터 로딩을 처리합니다.
export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <ImportPageComponent />
    </Suspense>
  );
}
