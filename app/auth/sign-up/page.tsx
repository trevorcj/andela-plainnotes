export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/env';
import { safeReturnTo } from '@/lib/validation';

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
  return <AuthForm mode="signup" next={safeReturnTo(p.next, '/onboarding')} configured={!!supabaseConfig()} />;
}
