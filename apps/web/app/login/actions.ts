'use server';

import { redirect } from 'next/navigation';
import { login as loginRequest } from '@/lib/api';
import { createSession, deleteSession } from '@/lib/session';

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Enter your email and password.' };
  }

  const result = await loginRequest(email, password);

  if (!result.ok) {
    return { error: result.message };
  }

  await createSession(result.data.accessToken);
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
