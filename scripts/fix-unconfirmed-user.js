#!/usr/bin/env node
/**
 * Unblocks a test account stuck in the old confirmation-link bug:
 * signUp() created the auth.users row, but the confirmation link failed
 * to exchange (wrong browser/device), so the user can neither log in
 * (in some cases) nor re-register (email already exists).
 *
 * Usage:
 *   node scripts/fix-unconfirmed-user.js you@example.com --check
 *   node scripts/fix-unconfirmed-user.js you@example.com --confirm   (mark email confirmed so they can log in now)
 *   node scripts/fix-unconfirmed-user.js you@example.com --delete    (remove the account so they can register again)
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

async function main() {
  const [, , email, mode] = process.argv;
  if (!email || !mode) {
    console.error('Usage: node scripts/fix-unconfirmed-user.js <email> --check|--confirm|--delete');
    process.exit(1);
  }

  const env = { ...loadEnvLocal(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Find the user by scanning pages (fine for a small test project).
  let user = null;
  for (let page = 1; page <= 20 && !user; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error('listUsers error:', error.message);
      process.exit(1);
    }
    user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (data.users.length < 200) break;
  }

  if (!user) {
    console.log(`No account found for ${email}.`);
    return;
  }

  console.log(`Found user ${user.id}`);
  console.log(`  email_confirmed_at: ${user.email_confirmed_at ?? 'null (unconfirmed)'}`);
  console.log(`  created_at:         ${user.created_at}`);

  if (mode === '--check') return;

  if (mode === '--confirm') {
    const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
    if (error) {
      console.error('Failed to confirm:', error.message);
      process.exit(1);
    }
    console.log(`Confirmed. ${email} can now log in with their existing password.`);
    return;
  }

  if (mode === '--delete') {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Failed to delete:', error.message);
      process.exit(1);
    }
    console.log(`Deleted. ${email} can now register again.`);
    return;
  }

  console.error('Unknown mode. Use --check, --confirm, or --delete.');
  process.exit(1);
}

main();
