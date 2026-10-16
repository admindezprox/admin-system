import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Creates a typed Supabase client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * Uses the Next.js 16 asynchronous cookies() API.
 * Operates under the authenticated user's session and row-level security (RLS).
 * Never uses or exposes service-role keys.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // In Next.js App Router, modifying cookies directly inside a
          // Server Component render cycle throws, which can be safely
          // ignored because middleware handles proactive session token refresh.
        }
      },
    },
  });
}
