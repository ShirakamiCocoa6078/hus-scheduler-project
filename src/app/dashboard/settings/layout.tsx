import { Header } from "@/components/layout/header";
import { FloatingActionButtons } from "@/components/layout/floating-action-buttons";
import type { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <FloatingActionButtons />
    </div>
  );
}
