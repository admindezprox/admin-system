import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { Database, FounderRole } from "./types";

export interface ActiveFounderProfile {
  id: string;
  email: string;
  fullName: string;
  role: FounderRole;
  isActive: boolean;
}

export interface FounderAuthVerification {
  isAuthenticated: boolean;
  isActiveFounder: boolean;
  founder: ActiveFounderProfile | null;
  error?: string;
}

/**
 * Server-side authoritative verification for founder accounts.
 *
 * This function enforces defense-in-depth:
 * 1. Cryptographically validates the user's auth token via supabase.auth.getUser()
 * 2. Queries public.founder_profiles for the authenticated user's ID
 * 3. Enforces that `is_active === true`
 *
 * Must be used by protected Server Components, Route Handlers, and Server Actions
 * to prevent unauthorized access by non-founder accounts.
 */
export async function verifyActiveFounder(
  supabase: SupabaseClient<Database>
): Promise<FounderAuthVerification> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      isAuthenticated: false,
      isActiveFounder: false,
      founder: null,
      error: authError?.message ?? "No active user session.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("founder_profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      isAuthenticated: true,
      isActiveFounder: false,
      founder: null,
      error: "Failed to query founder profile.",
    };
  }

  if (!profile || !profile.is_active) {
    return {
      isAuthenticated: true,
      isActiveFounder: false,
      founder: null,
      error: "User is not an active founder.",
    };
  }

  return {
    isAuthenticated: true,
    isActiveFounder: true,
    founder: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      isActive: profile.is_active,
    },
  };
}

/**
 * Authoritative guard for Server Components and Layouts.
 *
 * Verifies that the current request is from an authenticated user AND that
 * the user has an active record in `founder_profiles`.
 *
 * If unauthenticated -> redirects to /login (with optional ?next= parameter).
 * If authenticated but NOT an active founder -> signs out the user immediately
 * (to wipe the invalid session cookie) and redirects to /login?error=unauthorized.
 *
 * Returns the verified founder profile and authenticated Supabase client.
 */
export async function requireActiveFounder(returnTo?: string): Promise<{
  supabase: SupabaseClient<Database>;
  founder: ActiveFounderProfile;
}> {
  const supabase = await createClient();
  const verification = await verifyActiveFounder(supabase);

  if (!verification.isAuthenticated) {
    const nextParam = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${nextParam}`);
  }

  if (!verification.isActiveFounder || !verification.founder) {
    // Defense-in-depth: Immediately purge the invalid session cookie
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign-out error during redirect
    }
    redirect("/login?error=unauthorized");
  }

  return {
    supabase,
    founder: verification.founder,
  };
}

export type AssertFounderResult =
  | {
      ok: true;
      supabase: SupabaseClient<Database>;
      founder: ActiveFounderProfile;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

/**
 * Authoritative guard for Route Handlers and Server Actions.
 *
 * Does NOT throw a Next.js redirect error; instead returns an authorization result
 * so callers can return appropriate HTTP 401/403 status codes or structured error messages.
 *
 * Future Server Actions and Route Handlers MUST call this before reading or modifying
 * protected records.
 */
export async function assertActiveFounder(): Promise<AssertFounderResult> {
  const supabase = await createClient();
  const verification = await verifyActiveFounder(supabase);

  if (!verification.isAuthenticated) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required. Please sign in.",
    };
  }

  if (!verification.isActiveFounder || !verification.founder) {
    // Purge the invalid/inactive session cookie
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    return {
      ok: false,
      status: 403,
      error: "Access denied. Active founder privileges required.",
    };
  }

  return {
    ok: true,
    supabase,
    founder: verification.founder,
  };
}
