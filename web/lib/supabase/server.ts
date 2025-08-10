/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookies() as any;
          return store.get(name)?.value as string | undefined;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const store = await cookies() as any;
            store.set(name, value, options);
          } catch {
            // noop for Server Component context
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const store = await cookies() as any;
            store.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // noop for Server Component context
          }
        },
      },
    }
  );
} 