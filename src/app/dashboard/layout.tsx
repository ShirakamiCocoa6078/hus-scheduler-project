
import { Header } from "@/components/layout/header";
import { FloatingActionButtons } from "@/components/layout/floating-action-buttons"; // Changed import
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <FloatingActionButtons /> {/* Changed component */}
    </div>
  );
}
