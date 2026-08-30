import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Landplanr</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Sign in to your consultant account.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
