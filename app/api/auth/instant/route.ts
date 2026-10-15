import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = getAdminClient();
    if (admin) {
      try {
        await admin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: { name: cleanEmail.split('@')[0] }
        });
      } catch {
        // User may already exist in Supabase auth; non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      name: cleanEmail.split('@')[0]
    });
  } catch (err: any) {
    return NextResponse.json({ success: true });
  }
}
