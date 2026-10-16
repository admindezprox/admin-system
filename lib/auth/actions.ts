"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSafeRedirectUrl } from "./redirect";
import { validateLoginInput } from "./validation";
import { verifyTurnstileToken } from "./turnstile";
import { createClient } from "@/lib/supabase/server";

export interface LoginFormState {
  success: boolean;
  error: string | null;
  redirectTo?: string;
  errorTimestamp?: number;
}

/**
 * Server Action for Founder Sign-In.
 *
 * Enforces authoritative defense-in-depth:
 * 1. Validates inputs server-side before contacting any external services.
 * 2. Verifies Cloudflare Turnstile bot protection token with Cloudflare Siteverify.
 *    Rejects invalid/expired/missing tokens BEFORE calling Supabase auth.
 * 3. Authenticates credentials through Supabase Auth (signInWithPassword).
 * 4. Verifies token cryptographically with auth.getUser().
 * 5. Queries public.founder_profiles to confirm:
 *    - Record exists
 *    - Record id matches authenticated user ID
 *    - is_active === true
 * 6. Rejects any non-founder or inactive account by immediately terminating
 *    the Supabase session (signOut) so no orphaned session cookie remains.
 * 7. Returns sanitized error messages, never leaking database errors, tokens,
 *    or secrets to the client.
 */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  // 1. Server-side input validation
  const validation = validateLoginInput(formData);
  if (!validation.isValid || !validation.email || !validation.password) {
    return {
      success: false,
      error: validation.error ?? "Please enter a valid email and password.",
      errorTimestamp: Date.now(),
    };
  }

  // 2. Validate and sanitize destination redirect URL
  const rawNext = formData.get("next");
  const safeRedirect = getSafeRedirectUrl(rawNext, "/dashboard");

  // 3. Cloudflare Turnstile Bot Verification
  // The widget submits token as 'cf-turnstile-response' (or fallback 'turnstile-token')
  const turnstileToken =
    (formData.get("cf-turnstile-response") as string | null) ||
    (formData.get("turnstile-token") as string | null);

  let remoteIp: string | undefined;
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    remoteIp = forwarded ? forwarded.split(",")[0].trim() : realIp ?? undefined;
  } catch {
    // If headers cannot be accessed, proceed without remoteIp
  }

  const turnstileVerification = await verifyTurnstileToken(turnstileToken, {
    remoteIp,
  });

  if (!turnstileVerification.success) {
    return {
      success: false,
      error:
        turnstileVerification.error ??
        "Security verification failed. Please complete the challenge again.",
      errorTimestamp: Date.now(),
    };
  }

  // 4. Create server Supabase client (manages cookie store)
  const supabase = await createClient();

  // 5. Authenticate through Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: validation.email,
      password: validation.password,
    });

  if (authError || !authData.user) {
    // Return safe generic message to prevent account enumeration
    return {
      success: false,
      error: "Invalid email or password.",
      errorTimestamp: Date.now(),
    };
  }

  // 6. Cryptographically verify user identity
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== authData.user.id) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Safe no-op
    }
    return {
      success: false,
      error: "Unable to verify authentication. Please try again.",
      errorTimestamp: Date.now(),
    };
  }

  // 7. Authoritatively verify active founder profile in shared database
  const { data: profile, error: profileError } = await supabase
    .from("founder_profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Safe no-op
    }
    return {
      success: false,
      error: "An error occurred while verifying founder access.",
      errorTimestamp: Date.now(),
    };
  }

  if (!profile || !profile.is_active || profile.id !== user.id) {
    // User is authenticated in auth.users, but is NOT an active founder in founder_profiles.
    // Defense-in-depth: immediately sign out to wipe the session cookie from the client!
    try {
      await supabase.auth.signOut();
    } catch {
      // Safe no-op
    }
    return {
      success: false,
      error: "Access denied. Your account is not authorized as an active founder.",
      errorTimestamp: Date.now(),
    };
  }

  // 8. Successful authentication and authorization
  return {
    success: true,
    error: null,
    redirectTo: safeRedirect,
  };
}

/**
 * Server Action for Founder Sign-Out.
 *
 * Uses the server Supabase client to call signOut, invalidates the session
 * with Supabase Auth, and clears session cookies before redirecting to /login.
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Continue with redirect even if signOut throws
  }
  redirect("/login");
}
