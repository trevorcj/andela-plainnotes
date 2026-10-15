import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!targetEmail) {
  console.error('Usage: node --env-file=.env.local scripts/make-admin.mjs <email>');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log(`Searching for user with email: ${targetEmail}...`);
  const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email?.toLowerCase() === targetEmail);
  if (!user) {
    console.error(`User not found with email: ${targetEmail}. Please have them sign up first.`);
    process.exit(1);
  }

  console.log(`Found user: ${user.id} (${user.email}). Granting admin role...`);

  const { error: insertError } = await adminClient
    .from('user_roles')
    .insert({ user_id: user.id, role: 'admin' })
    .select();

  if (insertError && !insertError.message.includes('duplicate key')) {
    console.error('Failed to grant admin role:', insertError.message);
    process.exit(1);
  }

  console.log(`✓ User ${targetEmail} (${user.id}) is now successfully an Administrator.`);
  console.log(`They can now access /admin/workflows, /admin/sources, and /admin/catalog.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
