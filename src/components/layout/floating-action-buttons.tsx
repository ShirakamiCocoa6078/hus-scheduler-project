
"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel, // AlertDialogAction is not directly used for the confirm button, Button is used instead.
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, ArchiveRestore } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function FloatingActionButtons() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const handleClearCache = async () => {
    if (status !== "authenticated") {
      toast({
        title: "エラー",
        description: "この操作を行うにはログインしている必要があります。",
        variant: "destructive",
      });
      return;
    }
    setIsClearingCache(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        if (window.caches && typeof window.caches.keys === 'function') {
          const keys = await window.caches.keys();
          await Promise.all(keys.map(key => window.caches.delete(key)));
        }
        toast({
          title: "成功",
          description: "キャッシュとローカルデータが正常にクリアされました。",
        });
      }
    } catch (error) {
      console.error("キャッシュクリアエラー:", error);
      const message = error instanceof Error ? error.message : "キャッシュのクリア中に予期せぬエラーが発生しました。";
      toast({
        title: "キャッシュクリア失敗",
        description: `${message} もう一度お試しください。`,
        variant: "destructive",
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session || status !== "authenticated") {
        toast({
            title: "エラー",
            description: "アカウント情報を削除するにはログインしている必要があります。",
            variant: "destructive",
        });
        return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "アカウントの削除に失敗しました。");
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hus_scheduler_onboarded'); 
      }
      
      await signOut({ redirect: false }); 

      toast({
        title: "アカウント削除成功",
        description: "アカウント情報が削除されました。ログインページにリダイレクトします。",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (error) {
      console.error("アカウント削除エラー:", error);
      const message = error instanceof Error ? error.message : "アカウントの削除中にエラーが発生しました。";
      toast({
        title: "アカウント削除失敗",
        description: `${message} もう一度お試しください。`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsAlertDialogOpen(false);
    }
  };

  if (status !== "authenticated") {
    return null; 
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-3">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12 shadow-lg bg-card hover:bg-muted border-border text-foreground"
        aria-label="キャッシュとローカルデータをクリア"
        onClick={handleClearCache}
        disabled={isClearingCache || isDeleting}
      >
        {isClearingCache ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArchiveRestore className="h-6 w-6" />}
      </Button>

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg"
            aria-label="アカウント削除"
            disabled={isDeleting || isClearingCache}
          >
            {isDeleting && !isClearingCache ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アカウント削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              アカウントを削除すると、関連するすべてのデータがサーバーから消去されます。この操作は元に戻せません。本当に続行しますか？
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
    </div>
  );
}
