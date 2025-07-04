'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, PlusCircle, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label"; 
import Link from 'next/link';

interface Course {
  courseName: string;
  dayOfWeek: number;
  period: number;
  location: string;
}

const dayOfWeekMap: { [key: number]: string } = { 1: '月曜', 2: '火曜', 3: '水曜', 4: '木曜', 5: '金曜', 6: '土曜' };

export default function ConfirmSchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchTempCourses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/courses/confirm');
        if (!response.ok) {
          throw new Error('データの読み込みに失敗しました。');
        }
        const data = await response.json();
        if (data && Array.isArray(data)) {
          setCourses(data);
        }
      } catch (error) {
        toast({
          title: 'エラー',
          description: error instanceof Error ? error.message : '不明なエラーが発生しました。',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTempCourses();
  }, [toast]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/courses/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courses),
      });
      if (!response.ok) {
        throw new Error('保存中にエラーが発生しました。');
      }
      toast({
        title: '成功',
        description: '時間割が正常に保存されました。',
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: '保存エラー',
        description: error instanceof Error ? error.message : '不明なエラーが発生しました。',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">時間割の確認・修正</CardTitle>
          <CardDescription>
            UNIPAからインポートされた時間割データです。内容を確認し、必要であれば修正してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>授業名</TableHead>
                  <TableHead>曜日</TableHead>
                  <TableHead>時限</TableHead>
                  <TableHead>教室</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={course.courseName}
                        onChange={(e) => handleCourseChange(index, 'courseName', e.target.value)}
                        placeholder="例: 情報科学"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(course.dayOfWeek)}
                        onValueChange={(value) => handleCourseChange(index, 'dayOfWeek', Number(value))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(dayOfWeekMap).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                       <Select
                        value={String(course.period)}
                        onValueChange={(value) => handleCourseChange(index, 'period', Number(value))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map(p => <SelectItem key={p} value={String(p)}>{p}時限</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={course.location}
                        onChange={(e) => handleCourseChange(index, 'location', e.target.value)}
                        placeholder="例: G201"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeCourse(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" onClick={addCourse} className="mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            授業を追加
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
            <Button variant="ghost" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    ダッシュボードに戻る
                </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                保存して完了
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
