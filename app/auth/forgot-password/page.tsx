export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth-form';
import { supabaseConfig } from '@/lib/env';

export default async function Page() {
  if (supabaseConfig()) {
    try {
      const client = await db();
      const { data: { user } } = await client.auth.getUser();
      if (user) redirect('/app');
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err;
    }
  }

  return <AuthForm mode="reset" configured={!!supabaseConfig()} />;
}
