import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    let bodyEmail: string | undefined;
    try {
      const body = await req.json();
      bodyEmail = body?.email?.trim().toLowerCase();
    } catch {}

    const client = await db();
    const { data: { user } } = await client.auth.getUser();

    const targetUserId = user?.id;
    const targetEmail = user?.email || bodyEmail;

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();
    if (admin) {
      let resolvedUserId = targetUserId;
      if (!resolvedUserId && targetEmail) {
        try {
          const { data: { users } } = await admin.auth.admin.listUsers();
          const match = users?.find(u => u.email?.toLowerCase() === targetEmail);
          if (match) {
            resolvedUserId = match.id;
          }
        } catch (e) {
          console.warn('Could not list users for delete:', e);
        }
      }

      if (resolvedUserId) {
        try {
          await admin.from('plain_notes').delete().eq('user_id', resolvedUserId);
        } catch (e) {
          console.warn('Note cleanup ignored:', e);
        }

        try {
          await admin.auth.admin.deleteUser(resolvedUserId);
        } catch (error) {
          console.error('Delete user error:', error);
        }
      }
    }

    try {
      await client.auth.signOut();
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Account delete failure:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
