import test from "node:test";
import assert from "node:assert/strict";
import { getSafeRedirectUrl } from "../lib/auth/redirect.ts";
import {
  validateEmail,
  validatePassword,
  validateLoginInput,
} from "../lib/auth/validation.ts";

test("getSafeRedirectUrl — valid internal paths", () => {
  assert.equal(getSafeRedirectUrl("/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/dashboard/settings"), "/dashboard/settings");
  assert.equal(
    getSafeRedirectUrl("/dashboard?status=active&tab=profile"),
    "/dashboard?status=active&tab=profile"
  );
  assert.equal(
    getSafeRedirectUrl("/dashboard#top"),
    "/dashboard#top"
  );
  assert.equal(getSafeRedirectUrl("  /dashboard  "), "/dashboard");
});

test("getSafeRedirectUrl — open redirect and external URL defense", () => {
  // Protocol-relative URLs
  assert.equal(getSafeRedirectUrl("//evil.com"), "/dashboard");
  assert.equal(getSafeRedirectUrl("//evil.com/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectUrl("///evil.com"), "/dashboard");

  // Absolute external URLs
  assert.equal(getSafeRedirectUrl("https://evil.com"), "/dashboard");
  assert.equal(getSafeRedirectUrl("http://evil.com/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectUrl("https://dezprox.com.attacker.org"), "/dashboard");

  // Schemes / pseudo-protocols
  assert.equal(getSafeRedirectUrl("javascript:alert(1)"), "/dashboard");
  assert.equal(getSafeRedirectUrl("data:text/html,<script>alert(1)</script>"), "/dashboard");
  assert.equal(getSafeRedirectUrl("vbscript:msgbox(1)"), "/dashboard");

  // Backslash exploits (common parser bypasses)
  assert.equal(getSafeRedirectUrl("/\\evil.com"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/\\\\evil.com"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/dashboard\\evil"), "/dashboard");
  assert.equal(getSafeRedirectUrl("\\\\evil.com"), "/dashboard");

  // Control characters / CRLF injection
  assert.equal(getSafeRedirectUrl("/dashboard\r\nSet-Cookie: evil=1"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/dashboard\nInjected-Header"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/dashboard\tTabbed"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/dashboard\0NullByte"), "/dashboard");
});

test("getSafeRedirectUrl — redirect loop prevention", () => {
  assert.equal(getSafeRedirectUrl("/login"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/login/"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/login?next=/dashboard"), "/dashboard");
  assert.equal(getSafeRedirectUrl("/login?error=unauthorized"), "/dashboard");
});

test("getSafeRedirectUrl — invalid or missing inputs and custom fallbacks", () => {
  assert.equal(getSafeRedirectUrl(null), "/dashboard");
  assert.equal(getSafeRedirectUrl(undefined), "/dashboard");
  assert.equal(getSafeRedirectUrl(""), "/dashboard");
  assert.equal(getSafeRedirectUrl("   "), "/dashboard");
  assert.equal(getSafeRedirectUrl(123), "/dashboard");
  assert.equal(getSafeRedirectUrl({}), "/dashboard");
  assert.equal(getSafeRedirectUrl([]), "/dashboard");

  // Custom fallback
  assert.equal(getSafeRedirectUrl("//evil.com", "/custom-fallback"), "/custom-fallback");
  assert.equal(getSafeRedirectUrl(null, "/custom-fallback"), "/custom-fallback");
  assert.equal(getSafeRedirectUrl("/valid-path", "/custom-fallback"), "/valid-path");
});

test("validateEmail — valid email normalization", () => {
  const result1 = validateEmail("founder@dezprox.com");
  assert.equal(result1.isValid, true);
  assert.equal(result1.value, "founder@dezprox.com");

  const result2 = validateEmail("  FOUNDER.TEST+ADMIN@DEZPROX.COM  ");
  assert.equal(result2.isValid, true);
  assert.equal(result2.value, "founder.test+admin@dezprox.com");
});

test("validateEmail — invalid email rejection", () => {
  assert.equal(validateEmail("").isValid, false);
  assert.equal(validateEmail("   ").isValid, false);
  assert.equal(validateEmail(null).isValid, false);
  assert.equal(validateEmail(undefined).isValid, false);
  assert.equal(validateEmail("plainaddress").isValid, false);
  assert.equal(validateEmail("@missinguser.com").isValid, false);
  assert.equal(validateEmail("missingdomain@").isValid, false);
  assert.equal(validateEmail("missingdomain@.com").isValid, false);
  assert.equal(validateEmail("spaces in@domain.com").isValid, false);
  assert.equal(validateEmail("a".repeat(255) + "@dezprox.com").isValid, false);
});

test("validatePassword — length constraints and validation", () => {
  assert.equal(validatePassword("valid-secret-123").isValid, true);
  assert.equal(validatePassword("123456").isValid, true); // exactly 6 chars

  // Too short
  const shortResult = validatePassword("12345");
  assert.equal(shortResult.isValid, false);
  assert.match(shortResult.error ?? "", /at least 6 characters/i);

  // Missing or non-string
  assert.equal(validatePassword("").isValid, false);
  assert.equal(validatePassword(null).isValid, false);
  assert.equal(validatePassword(undefined).isValid, false);

  // Overly long
  assert.equal(validatePassword("x".repeat(300)).isValid, false);
});

test("validateLoginInput — FormData extraction and validation", () => {
  // Valid form
  const validData = new FormData();
  validData.set("email", "Founder@dezprox.com");
  validData.set("password", "strong-password-123");
  const validRes = validateLoginInput(validData);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.email, "founder@dezprox.com");
  assert.equal(validRes.password, "strong-password-123");

  // Missing password
  const missingPw = new FormData();
  missingPw.set("email", "founder@dezprox.com");
  const missingPwRes = validateLoginInput(missingPw);
  assert.equal(missingPwRes.isValid, false);
  assert.match(missingPwRes.error ?? "", /password/i);

  // Invalid email
  const badEmail = new FormData();
  badEmail.set("email", "not-an-email");
  badEmail.set("password", "valid-password");
  const badEmailRes = validateLoginInput(badEmail);
  assert.equal(badEmailRes.isValid, false);
  assert.match(badEmailRes.error ?? "", /email/i);
});
