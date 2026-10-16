/**
 * Supabase Environment Validation Helper
 *
 * Validates the presence of required public Supabase environment variables.
 * In accordance with security requirements, error messages NEVER print or leak
 * environment variable values, tokens, or keys.
 */

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates and returns the public Supabase configuration.
 * Throws a descriptive error indicating only the variable names if missing.
 */
export function getSupabaseEnv(): SupabaseEnvConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

    throw new Error(
      `Missing required Supabase environment variable(s): ${missing.join(", ")}. Please configure them in .env.local.`
    );
  }

  return { url, anonKey };
}
