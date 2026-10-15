import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const client = await db();
    const { data: { user } } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();
    if (admin) {
      // Delete user's notes if plain_notes table exists
      try {
        await admin.from('plain_notes').delete().eq('user_id', user.id);
      } catch (e) {
        console.warn('Note cleanup ignored:', e);
      }

      // Delete user from auth
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        console.error('Delete user error:', error);
      }
    }

    // Sign out user session
    await client.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Account delete failure:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
