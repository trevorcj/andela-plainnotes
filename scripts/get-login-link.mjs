import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const targetEmail = process.argv[2]?.trim().toLowerCase();

if (!targetEmail) {
  console.error('Usage: node --env-file=.env.local scripts/get-login-link.mjs <email>');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  const linkRes = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: targetEmail
  });

  if (linkRes.error) {
    console.error('Error generating link:', linkRes.error.message);
    process.exit(1);
  }

  const token_hash = linkRes.data?.properties?.hashed_token;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const directUrl = `${siteUrl}/auth/confirm?token_hash=${token_hash}&type=magiclink&next=/app`;

  console.log(`\n========================================`);
  console.log(`Instant 1-Click Login Link for: ${targetEmail}`);
  console.log(`========================================\n`);
  console.log(directUrl);
  console.log(`\nCopy and paste this link into your browser to sign in instantly without waiting for an email.\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
