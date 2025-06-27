
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Database, ServerCrash, User as UserIcon, MoreVertical, Pencil, Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


// Represents a subset of the Prisma User model for display
interface DisplayUser {
  id: string;
  name?: string | null;
  email: string | null;
  image?: string | null;
  isSetupComplete: boolean;
  archived: boolean;
}

export default function DevAdminPage() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", email: "" });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/get-temp-data");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "データの取得に失敗しました。");
      }
      const data: DisplayUser[] = await response.json();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setError(message);
      toast({
        title: "エラー",
        description: `データ取得失敗: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (user: DisplayUser) => {
    setSelectedUser(user);
    setEditFormData({ name: user.name ?? '', email: user.email ?? '' });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: DisplayUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editFormData.name, email: editFormData.email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user.');
      }
      const updatedUser: DisplayUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? {...u, ...updatedUser} : u));
      toast({ title: "成功", description: "ユーザー情報が更新されました。" });
      setIsEditDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "エラー", description: `更新失敗: ${message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async (user: DisplayUser) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !user.archived }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update archive status.');
      }
      const updatedUser: DisplayUser = await response.json();
      setUsers(users.map(u => u.id === updatedUser.id ? {...u, ...updatedUser} : u));
      toast({ title: "成功", description: `ユーザーを${updatedUser.archived ? '保管' : '保管解除'}しました。` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "エラー", description: `状態変更失敗: ${message}`, variant: 'destructive' });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user.');
      }
      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast({ title: "成功", description: "ユーザーを削除しました。" });
      setIsDeleteDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast({ title: "エラー", description: `削除失敗: ${message}`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-8 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Database className="mr-3 h-8 w-8" />
          開発者用データベース閲覧
        </h1>
        <Button variant="outline" asChild>
          <Link href="/login">ログインページへ戻る</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-muted-foreground">
          データベースから直接取得した現在のユーザーデータです。
        </p>
        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          再読み込み
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">データを読み込み中...</p>
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-80 text-destructive">
            <ServerCrash className="h-12 w-12" />
            <p className="mt-4 font-semibold">データの読み込みに失敗しました</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <Table>
            <TableCaption>
              {users.length > 0 ? `${users.length}人のユーザーが見つかりました。` : "データベースにユーザーがいません。"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">User</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Onboarded</TableHead>
                <TableHead className="w-[280px]">User ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} data-archived={user.archived} className="data-[archived=true]:bg-muted/50 data-[archived=true]:text-muted-foreground">
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.name ?? "N/A"}
                    {user.archived && <Badge variant="secondary" className="ml-2">Archived</Badge>}
                  </TableCell>
                  <TableCell>{user.email ?? "N/A"}</TableCell>
                  <TableCell className="text-center">
                    {user.isSetupComplete ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="destructive">No</Badge>
                    )}
                  </TableCell>
                   <TableCell className="font-mono text-xs">{user.id}</TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuLabel>Actions</DropdownMenuLabel>
                         <DropdownMenuItem onClick={() => handleEditClick(user)}>
                           <Pencil className="mr-2 h-4 w-4" />
                           Edit User
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => handleArchiveToggle(user)}>
                           <Archive className="mr-2 h-4 w-4" />
                           {user.archived ? 'Unarchive' : 'Archive'}
                         </DropdownMenuItem>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem
                           className="text-destructive focus:text-destructive"
                           onClick={() => handleDeleteClick(user)}
                         >
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete User
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
       <div className="mt-8 p-4 border border-accent bg-accent/10 rounded-md">
        <h3 className="text-md font-semibold text-accent mb-2">Prisma Userモデルのヒント:</h3>
        <pre className="text-xs bg-card p-2 rounded overflow-x-auto">
{`model User {
  id              String    @id @default(cuid())
  name            String?
  email           String?   @unique
  emailVerified   DateTime?
  image           String?
  onboardingData  Json?
  isSetupComplete Boolean   @default(false)
  archived        Boolean   @default(false)
  accounts        Account[]
  sessions        Session[]
}`}
        </pre>
         <p className="text-xs text-muted-foreground mt-2">
            このページはUserモデルのデータを表示しています。関連するAccountやSessionモデルのデータは含まれていません。
          </p>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} のプロフィール情報を変更します。クリックして保存してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              変更を保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は元に戻せません。ユーザー「{selectedUser?.name}」を完全に削除します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSubmitting(false)} disabled={isSubmitting}>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              削除
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
