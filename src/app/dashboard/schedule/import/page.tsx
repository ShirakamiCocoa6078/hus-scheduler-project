
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Save, AlertTriangle, XCircle, Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CourseData {
  dayOfWeek: string;
  period: string;
  courseName: string;
  location: string;
}

function ImportPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ["月", "火", "水", "木", "金", "土", "日"];
  const periods = ["1", "2", "3", "4", "5", "6"];

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
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

  const handleInputChange = (index: number, field: keyof CourseData, value: string) => {
    const updatedCourses = [...courses];
    updatedCourses[index] = { ...updatedCourses[index], [field]: value };
    setCourses(updatedCourses);
  };

  const handleSelectChange = (index: number, field: 'dayOfWeek' | 'period', value: string) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
  };

  const handleAddRow = () => {
    setCourses([...courses, { dayOfWeek: "月", period: "1", courseName: "", location: "" }]);
  };

  const handleRemoveRow = (indexToRemove: number) => {
    setCourses(courses.filter((_, index) => index !== indexToRemove));
  };


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
          <CardDescription>UNIPAから以下の授業データをインポートします。内容を編集し、問題がなければ保存してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">曜日</TableHead>
                  <TableHead className="w-[120px]">時限</TableHead>
                  <TableHead className="w-1/3 min-w-[200px]">授業名</TableHead>
                  <TableHead className="min-w-[120px]">教室</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select value={course.dayOfWeek} onValueChange={(value) => handleSelectChange(index, 'dayOfWeek', value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                              {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                          </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                         <Select value={course.period} onValueChange={(value) => handleSelectChange(index, 'period', value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell><Input value={course.courseName} onChange={(e) => handleInputChange(index, 'courseName', e.target.value)} /></TableCell>
                    <TableCell><Input value={course.location} onChange={(e) => handleInputChange(index, 'location', e.target.value)} /></TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(index)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Button variant="outline" onClick={handleAddRow}>
                <PlusCircle className="mr-2 h-4 w-4" />
                空の行を追加
            </Button>
            <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    キャンセル
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  保存する
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

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
