"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Script from "next/script";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { loginAction, type LoginFormState } from "@/lib/auth/actions";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "error-callback"?: (error?: string) => void;
          "expired-callback"?: () => void;
          "timeout-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

interface LoginFormProps {
  initialNext?: string;
  initialError?: string;
}

const initialState: LoginFormState = {
  success: false,
  error: null,
};

export function LoginForm({ initialNext, initialError }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [, startTransition] = useTransition();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Trigger navigation on successful authentication
  useEffect(() => {
    if (state.success && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state.success, state.redirectTo]);

  // Reset Turnstile widget after a failed submission attempt
  useEffect(() => {
    if (state.error || state.errorTimestamp) {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // Ignore reset error
        }
      }
    }
  }, [state.error, state.errorTimestamp]);

  // Render Turnstile widget once script and container are ready
  useEffect(() => {
    if (!siteKey || !turnstileContainerRef.current) return;

    function renderWidget() {
      if (!window.turnstile || !turnstileContainerRef.current) return;

      // Prevent rendering if widget already exists
      if (widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey!,
          theme: "dark",
          size: "normal",
          callback: (token: string) => {
            setTurnstileToken(token);
            setTurnstileError(null);
          },
          "error-callback": () => {
            setTurnstileToken("");
            setTurnstileError("Security verification failed. Please try again.");
          },
          "expired-callback": () => {
            setTurnstileToken("");
            setTurnstileError("Verification challenge expired. Please verify again.");
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          "timeout-callback": () => {
            setTurnstileToken("");
            setTurnstileError("Verification timed out. Please try again.");
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
        });
        widgetIdRef.current = id;
      } catch {
        // Fallback if render throws
      }
    }

    if (window.turnstile) {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup error
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, scriptLoaded]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!siteKey) {
      event.preventDefault();
      setTurnstileError("Bot protection is not configured on this environment.");
      return;
    }

    if (!turnstileToken) {
      event.preventDefault();
      setTurnstileError("Please complete the bot protection challenge before signing in.");
      return;
    }

    setTurnstileError(null);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("cf-turnstile-response", turnstileToken);
    formData.set("turnstile-token", turnstileToken);

    // Single-use token: clear client token state immediately upon submission
    setTurnstileToken("");

    startTransition(() => {
      formAction(formData);
    });
  }

  const displayError =
    state.error ||
    (initialError === "unauthorized"
      ? "Session expired or access denied. Please sign in with an authorized active founder account."
      : null);

  return (
    <>
      {/* Cloudflare Turnstile Official Explicit API Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/80 shadow-inner">
            <ShieldCheck className="h-7 w-7 text-emerald-400" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Dezprox Founder Access
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to access the private administrative control center.
          </p>
        </div>

        {/* Security notice banner */}
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300">
          <span className="font-semibold">Restricted System:</span> This portal is strictly restricted to authorized Dezprox founders. Public registration is not permitted.
        </div>

        {/* Missing Site Key Warning */}
        {!siteKey && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-semibold text-amber-300">Configuration Notice</div>
              <p className="mt-0.5 text-amber-200/80 leading-relaxed">
                NEXT_PUBLIC_TURNSTILE_SITE_KEY is not defined. Please configure it in your environment.
              </p>
            </div>
          </div>
        )}

        {/* Failure Feedback */}
        {displayError && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
            <div className="flex-1 font-medium leading-relaxed">{displayError}</div>
          </div>
        )}

        {/* Success Feedback */}
        {state.success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-200"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <div className="flex-1 font-medium">
              Founder credentials verified. Directing to dashboard...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="hidden"
            name="next"
            value={initialNext || "/dashboard"}
          />
          <input
            type="hidden"
            name="cf-turnstile-response"
            value={turnstileToken}
          />
          <input
            type="hidden"
            name="turnstile-token"
            value={turnstileToken}
          />

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Founder Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                enterKeyHint="next"
                disabled={isPending || state.success}
                aria-describedby={displayError ? "form-error" : undefined}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                placeholder="founder@dezprox.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
              >
                Password
              </label>
            </div>
            <div className="relative mt-2">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                enterKeyHint="done"
                disabled={isPending || state.success}
                aria-describedby={displayError ? "form-error" : undefined}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 py-3 pr-11 pl-4 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isPending || state.success}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-200 focus:outline-none disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Cloudflare Turnstile Bot Protection Widget */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div
              ref={turnstileContainerRef}
              className="min-h-[65px] flex items-center justify-center"
              aria-label="Cloudflare Turnstile Bot Verification Challenge"
            />
            {turnstileError && (
              <p className="mt-2 text-xs font-medium text-amber-400 text-center" role="alert">
                {turnstileError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || state.success || !siteKey}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Verifying credentials...</span>
                </>
              ) : state.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span>Sign In to Founder Portal</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security info footer */}
        <div className="mt-8 border-t border-zinc-800/80 pt-6 text-center text-xs text-zinc-500">
          Protected by Cloudflare Turnstile and authoritative founder profile verification.
        </div>
      </div>
    </>
  );
}
