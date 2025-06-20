
"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";

export function DeleteAccountButton() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { setOnboardedStatus } = useOnboardingStatus();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!session) return;

    setIsDeleting(true);
    try {
      // Simulate backend deletion if needed
      // For now, clear client-side data and sign out

      // Clear all relevant localStorage items
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hus_scheduler_onboarded');
        localStorage.removeItem('user_department');
        localStorage.removeItem('user_home_station');
        localStorage.removeItem('user_university_station');
        localStorage.removeItem('user_sync_moodle');
        // Add any other keys specific to your app
      }
      setOnboardedStatus(false); // Update onboarding hook state

      await signOut({ redirect: false }); // Sign out without immediate redirect

      toast({
        title: "アカウント削除成功",
        description: "アカウント情報が削除されました。ログインページにリダイレクトします。",
      });

      // Wait a bit for toast to show, then redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (error) {
      console.error("アカウント削除エラー:", error);
      toast({
        title: "アカウント削除失敗",
        description: "アカウントの削除中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsAlertDialogOpen(false);
    }
  };

  if (!session) {
    return null; // Don't show button if not logged in
  }

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg z-50"
          aria-label="アカウント削除"
        >
          <Trash2 className="h-6 w-6" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>アカウント削除の確認</AlertDialogTitle>
          <AlertDialogDescription>
            アカウントを削除すると、関連するすべてのデータが消去されます。この操作は元に戻せません。本当に続行しますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            削除する
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
