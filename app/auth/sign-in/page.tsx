export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { safeReturnTo } from '@/lib/validation';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/env';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (supabaseConfig()) {
    try {
      const client = await db();
      const { data: { user } } = await client.auth.getUser();
      if (user) redirect('/app');
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err;
    }
  }

  const p = await searchParams;
  return (
    <AuthForm
      mode="signin"
      next={safeReturnTo(p.next)}
      configured={!!supabaseConfig()}
      notice={
        p.updated === '1'
          ? 'Your password has been updated. Sign in with your new password.'
          : p.error === 'confirmation'
          ? 'The confirmation link is invalid or expired. Request a new recovery link or try signing in.'
          : undefined
      }
    />
  );
}
