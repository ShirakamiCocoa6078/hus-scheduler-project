"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks } from "lucide-react";
import Image from "next/image";

export function TaskManagementWidget() {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 md:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <ListChecks className="mr-3 h-6 w-6" />
          今後のタスク
        </CardTitle>
         <CardDescription>この機能は現在準備中です。</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="text-center py-8">
          <Image src="https://placehold.co/300x200.png" alt="準備中の機能" width={300} height={200} className="mx-auto rounded-md mb-4 opacity-70" data-ai-hint="placeholder abstract" />
          <p className="text-muted-foreground font-medium text-lg">新しいタスク管理機能がまもなく登場します！</p>
          <p className="text-sm text-muted-foreground">アップデートにご期待ください。</p>
        </div>
      </CardContent>
    </Card>
  );
}
