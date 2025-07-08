// /app/dashboard/admin/db-viewer/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash } from 'lucide-react';


function DataTable({ title, data, error }: { title: string, data?: any[], error?: string }) {
  if (error) {
     return (
        <Alert variant="destructive" className="mb-8">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>{title} 데이터 로딩 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
     )
  }

  if (!data) return null;

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{title} <Badge variant="secondary">{data.length}件</Badge></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
             <TableHeader>
                <TableRow>
                    {columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                </TableRow>
             </TableHeader>
             <TableBody>
                {data.map((row, index) => (
                    <TableRow key={index}>
                        {columns.map(col => (
                            <TableCell key={col} className="text-xs">
                                {typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col] ?? 'null')}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
             </TableBody>
             {data.length === 0 && <TableCaption>데이터가 없습니다.</TableCaption>}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DbViewerPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch('/api/admin/all-data');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch data');
        }
        const allData = await response.json();
        setData(allData);
    } catch(e) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred';
        setError(message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-headline">データベースビューア</h1>
        <div className="flex gap-2">
            <Button onClick={fetchData} disabled={isLoading} variant="outline">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              更新
            </Button>
            <Button asChild>
                <Link href="/dev-admin">管理ページに戻る</Link>
            </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>データ取得エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data ? (
        <>
          <DataTable title="Users" data={data.users} />
          <DataTable title="Accounts" data={data.accounts} />
          <DataTable title="Sessions" data={data.sessions} />
          <DataTable title="Courses" data={data.courses} />
          <DataTable title="Tasks" data={data.tasks} />
        </>
      ) : (
        <p>データの表示に失敗しました。</p>
      )}
    </div>
  );
}
