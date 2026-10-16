/**
 * Cloudflare Turnstile Server-Side Verification Helper
 *
 * Validates the Turnstile response token with Cloudflare's official Siteverify API.
 * Never exposes TURNSTILE_SECRET_KEY to client-side code.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  messages?: string[];
}

/**
 * Maps Cloudflare Turnstile error codes to safe, user-friendly error messages.
 * Prevents internal configuration or API details from leaking.
 */
function mapTurnstileErrorCode(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return "Bot verification failed. Please complete the security check again.";
  }

  const primaryCode = errorCodes[0];

  switch (primaryCode) {
    case "timeout-or-duplicate":
      return "Security verification has expired or was already used. Please complete the check again.";
    case "invalid-input-response":
      return "Security verification token is invalid or has expired. Please try again.";
    case "missing-input-response":
      return "Please complete the bot protection challenge before signing in.";
    case "bad-request":
      return "Verification request was rejected. Please refresh the page and try again.";
    case "invalid-input-secret":
    case "missing-input-secret":
      return "Security verification service is misconfigured. Please contact system administration.";
    case "internal-error":
      return "Cloudflare security service encountered an internal error. Please try again in a moment.";
    default:
      return "Bot verification failed. Please complete the security check again.";
  }
}

export interface VerifyTurnstileOptions {
  secretKey?: string;
  remoteIp?: string;
  fetchFn?: typeof fetch;
}

/**
 * Verifies a Turnstile response token against Cloudflare's Siteverify endpoint.
 *
 * @param token - The token received from the client-side cf-turnstile widget.
 * @param options - Optional overrides for secretKey, remoteIp, and fetch function (useful for unit testing).
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  options: VerifyTurnstileOptions = {}
): Promise<TurnstileVerificationResult> {
  const secretKey = options.secretKey ?? process.env.TURNSTILE_SECRET_KEY;

  // 1. Verify environment configuration
  if (!secretKey || secretKey.trim() === "") {
    return {
      success: false,
      error: "Bot protection is misconfigured: TURNSTILE_SECRET_KEY is missing.",
      errorCodes: ["missing-input-secret"],
    };
  }

  // 2. Verify token presence
  if (!token || token.trim() === "") {
    return {
      success: false,
      error: "Please complete the bot protection challenge.",
      errorCodes: ["missing-input-response"],
    };
  }

  const fetchClient = options.fetchFn ?? fetch;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey.trim());
    formData.append("response", token.trim());
    if (options.remoteIp) {
      formData.append("remoteip", options.remoteIp);
    }

    const response = await fetchClient(SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Bot verification service returned HTTP error (${response.status}). Please try again.`,
        errorCodes: ["http-error"],
      };
    }

    const data = (await response.json()) as SiteverifyResponse;

    if (data.success) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: mapTurnstileErrorCode(data["error-codes"]),
      errorCodes: data["error-codes"],
    };
  } catch {
    return {
      success: false,
      error: "Bot verification service unavailable. Please check your network and try again.",
      errorCodes: ["network-error"],
    };
  }
}
