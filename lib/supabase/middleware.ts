import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

/**
 * Refreshes Supabase authentication tokens on incoming requests.
 *
 * SCOPE & INTENT (PHASE 1):
 * - This helper refreshes the user's Supabase session cookie so Server Components
 *   and Server Actions receive valid, unexpired credentials.
 * - This middleware does NOT perform route redirection or founder authorization checks
 *   at this stage.
 * - In accordance with security architecture, true founder authorization MUST be
 *   verified server-side in Server Components and Server Actions by checking
 *   the authenticated user's active status in `public.founder_profiles`.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do not remove auth.getUser(). Calling getUser() validates the token
  // with Supabase Auth and triggers a cookie refresh if near expiration.
  // We avoid getSession() as it only reads the cookie without cryptographic verification.
  await supabase.auth.getUser();

  return supabaseResponse;
}
