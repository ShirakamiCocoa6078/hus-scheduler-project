
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Loader2 } from 'lucide-react';

function LoginPageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">ログインページを読み込んでいます...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
