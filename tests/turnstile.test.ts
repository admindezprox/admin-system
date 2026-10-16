import test from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstileToken } from "../lib/auth/turnstile.ts";

test("verifyTurnstileToken — rejects missing or empty tokens without calling fetch", async () => {
  let fetchCalled = false;
  const mockFetch: typeof fetch = async () => {
    fetchCalled = true;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  const resNull = await verifyTurnstileToken(null, {
    secretKey: "test-secret",
    fetchFn: mockFetch,
  });
  assert.equal(resNull.success, false);
  assert.match(resNull.error ?? "", /complete the bot protection challenge/i);
  assert.equal(fetchCalled, false);

  const resEmpty = await verifyTurnstileToken("   ", {
    secretKey: "test-secret",
    fetchFn: mockFetch,
  });
  assert.equal(resEmpty.success, false);
  assert.equal(fetchCalled, false);
});

test("verifyTurnstileToken — rejects missing secret key with safe configuration error", async () => {
  let fetchCalled = false;
  const mockFetch: typeof fetch = async () => {
    fetchCalled = true;
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  const res = await verifyTurnstileToken("valid-token", {
    secretKey: "",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, false);
  assert.match(res.error ?? "", /TURNSTILE_SECRET_KEY is missing/i);
  assert.equal(fetchCalled, false);
});

test("verifyTurnstileToken — succeeds when Cloudflare returns success: true", async () => {
  let capturedBody = "";
  const mockFetch: typeof fetch = async (_url, init) => {
    capturedBody = init?.body?.toString() ?? "";
    return new Response(
      JSON.stringify({
        success: true,
        challenge_ts: "2026-10-16T12:00:00Z",
        hostname: "admin.dezprox.com",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const res = await verifyTurnstileToken("sample-valid-token-123", {
    secretKey: "mock-secret-xyz",
    remoteIp: "203.0.113.195",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, true);
  assert.equal(res.error, undefined);
  assert.match(capturedBody, /secret=mock-secret-xyz/);
  assert.match(capturedBody, /response=sample-valid-token-123/);
  assert.match(capturedBody, /remoteip=203\.0\.113\.195/);
});

test("verifyTurnstileToken — handles invalid or expired token rejection", async () => {
  const mockFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const res = await verifyTurnstileToken("invalid-token", {
    secretKey: "mock-secret-xyz",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, false);
  assert.match(res.error ?? "", /invalid or has expired/i);
  assert.deepEqual(res.errorCodes, ["invalid-input-response"]);
});

test("verifyTurnstileToken — handles timeout or duplicate token error", async () => {
  const mockFetch: typeof fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  const res = await verifyTurnstileToken("used-token", {
    secretKey: "mock-secret-xyz",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, false);
  assert.match(res.error ?? "", /expired or was already used/i);
});

test("verifyTurnstileToken — handles upstream HTTP 500 error", async () => {
  const mockFetch: typeof fetch = async () => {
    return new Response("Internal Server Error", { status: 500 });
  };

  const res = await verifyTurnstileToken("token-upstream-err", {
    secretKey: "mock-secret-xyz",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, false);
  assert.match(res.error ?? "", /HTTP error \(500\)/i);
});

test("verifyTurnstileToken — handles network / fetch exceptions safely", async () => {
  const mockFetch: typeof fetch = async () => {
    throw new Error("DNS resolution failed");
  };

  const res = await verifyTurnstileToken("token-network-err", {
    secretKey: "mock-secret-xyz",
    fetchFn: mockFetch,
  });

  assert.equal(res.success, false);
  assert.match(res.error ?? "", /service unavailable/i);
});
