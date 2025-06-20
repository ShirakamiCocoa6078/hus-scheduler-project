
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
// useOnboardingStatus はここでは直接不要かもしれませんが、クリア処理のために残しておきます。
// ただし、実際のオンボーディング状態はセッション由来になります。

export function DeleteAccountButton() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

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
      // バックエンドにアカウント削除リクエストを送信
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "アカウントの削除に失敗しました。");
      }

      // クライアント側のlocalStorageクリア（補助的）
      // 主要なデータはサーバー側で削除されるべき
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hus_scheduler_onboarded'); // 古いキーも一応削除
        // 他のアプリ固有のlocalStorage項目があればここに追加
      }
      
      // NextAuthセッションからサインアウト
      await signOut({ redirect: false }); 

      toast({
        title: "アカウント削除成功",
        description: "アカウント情報が削除されました。ログインページにリダイレクトします。",
      });

      // 少し待ってからリダイレクト（トースト表示のため）
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
    return null; // ログインしていない場合はボタンを表示しない
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
  );
}
