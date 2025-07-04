'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, ArrowLeft } from 'lucide-react';

export default function ManageSchedulePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">강의 시간표 관리</CardTitle>
          <CardDescription>
            강의 시간표 스크린샷을 업로드하여 일정을 자동으로 추가하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">이미지 업로드 (기능 준비 중)</h3>
            <p className="text-sm text-muted-foreground mt-2">
              여기를 클릭하거나 파일을 드래그하여 시간표를 업로드하세요.
            </p>
             <Button variant="outline" className="mt-4" disabled>
                파일 선택
            </Button>
          </div>
          <div className="p-4 border rounded-lg bg-secondary/30">
            <h4 className="font-semibold text-left">진행 과정</h4>
            <ol className="list-decimal list-inside text-left text-sm text-muted-foreground mt-2 space-y-1">
                <li>시간표 이미지를 업로드하면 시스템이 자동으로 텍스트를 분석합니다 (OCR 기능).</li>
                <li>분석된 강의 목록 초안이 아래에 표시됩니다.</li>
                <li>잘못 인식된 정보는 직접 수정하고, 누락된 강의는 수동으로 추가할 수 있습니다.</li>
                <li>'저장하기' 버튼을 누르면 최종 시간표가 데이터베이스에 저장됩니다.</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
           <Button variant="outline" asChild>
                <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    대시보드로 돌아가기
                </Link>
           </Button>
           <Button disabled>저장하기</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
