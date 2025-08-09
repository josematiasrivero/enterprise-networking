import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function requireAnon() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/groups");
}

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const supabase = createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=invalid_credentials");
  }
  redirect("/groups");
}

async function signUp(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const supabase = createServerClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect("/login?error=signup_failed");
  }
  redirect("/groups");
}

export default async function LoginPage() {
  await requireAnon();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <form action={signIn} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2"
          >
            Sign in
          </button>
        </form>
        <div className="text-center text-sm text-neutral-500">or</div>
        <form action={signUp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email2" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email2"
              name="email"
              type="email"
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password2" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password2"
              name="password"
              type="password"
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md border px-4 py-2"
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
} 