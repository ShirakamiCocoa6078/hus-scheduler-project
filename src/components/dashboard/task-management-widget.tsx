"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export function TaskManagementWidget() {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary flex items-center">
          <ListChecks className="mr-3 h-6 w-6" />
          今後のタスク
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
