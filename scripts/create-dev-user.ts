import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!SUPABASE_URL) {
    console.error("SUPABASE_URL is not set");
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
    process.exit(1);
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = "dev@local.com";
  const password = "password";

  // Check if user exists
  const { data: usersList, error: listErr } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }
  const existing = usersList?.users?.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    console.log("Dev user already exists:", existing.email);
    return;
  }

  const { data: created, error: createErr } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "dev" },
  });
  if (createErr) {
    console.error("Failed to create dev user:", createErr.message);
    process.exit(1);
  }

  console.log("Created dev user:", created.user?.email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 