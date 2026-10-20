import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyActiveFounder } from "@/lib/supabase/founder";
import { getSafeRedirectUrl } from "@/lib/auth/redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Founder Sign In — Dezprox Admin",
  description: "Secure administrative sign-in for Dezprox founders",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = await searchParams;
  const rawNext = resolvedParams.next;
  const rawError = resolvedParams.error;

  // Check if caller already has an active founder session
  const supabase = await createClient();
  const verification = await verifyActiveFounder(supabase);

  if (verification.isActiveFounder) {
    // Authenticated active founder: redirect to intended dashboard destination
    const safeTarget = getSafeRedirectUrl(rawNext, "/dashboard");
    redirect(safeTarget);
  }

  // Not an active founder (or unauthenticated): present login interface
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/80 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full flex justify-center">
        <LoginForm
          initialNext={getSafeRedirectUrl(rawNext, "/dashboard")}
          initialError={rawError}
        />
      </div>
    </div>
  );
}
