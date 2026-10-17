import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidUUID,
  isValidUserAgentCategory,
  isValidConsentDecision,
  sanitizeSearchQuery,
  calculatePagination,
  VALID_USER_AGENT_CATEGORIES,
  VALID_CONSENT_DECISIONS,
} from "../lib/consent-tracking/validation.ts";

test("isValidUUID — accepts valid UUID formats and rejects invalid ones", () => {
  const validV4 = "c748fa71-55db-4414-b816-16f3969ffb12";
  const validV1 = "e3b0c442-98fc-11e9-a2a3-2a2ae2dbcce4";
  assert.equal(isValidUUID(validV4), true);
  assert.equal(isValidUUID(validV1), true);
  assert.equal(isValidUUID(`  ${validV4}  `), true);

  // Invalid formats
  assert.equal(isValidUUID("not-a-uuid"), false);
  assert.equal(isValidUUID("c748fa71-55db-4414-b816"), false);
  assert.equal(isValidUUID(""), false);
  assert.equal(isValidUUID(null), false);
  assert.equal(isValidUUID(undefined), false);
  assert.equal(isValidUUID("c748fa71-55db-4414-b816-16f3969ffb12; DROP TABLE cookie_consents;"), false);
});

test("isValidUserAgentCategory — strictly validates schema check constraint categories", () => {
  // Authoritative categories from migration: ('desktop', 'mobile', 'tablet', 'bot', 'unknown')
  assert.deepEqual([...VALID_USER_AGENT_CATEGORIES], [
    "desktop",
    "mobile",
    "tablet",
    "bot",
    "unknown",
  ]);

  for (const cat of VALID_USER_AGENT_CATEGORIES) {
    assert.equal(isValidUserAgentCategory(cat), true);
    assert.equal(isValidUserAgentCategory(cat.toUpperCase()), true);
    assert.equal(isValidUserAgentCategory(`  ${cat}  `), true);
  }

  // Unsupported or arbitrary categories
  assert.equal(isValidUserAgentCategory("smart_tv"), false);
  assert.equal(isValidUserAgentCategory("wearable"), false);
  assert.equal(isValidUserAgentCategory("server"), false);
  assert.equal(isValidUserAgentCategory(""), false);
  assert.equal(isValidUserAgentCategory(null), false);
  assert.equal(isValidUserAgentCategory(123), false);
});

test("isValidConsentDecision — validates supported decision filter categories", () => {
  assert.deepEqual([...VALID_CONSENT_DECISIONS], [
    "all",
    "full",
    "essential_only",
    "analytics",
    "marketing",
  ]);

  for (const decision of VALID_CONSENT_DECISIONS) {
    assert.equal(isValidConsentDecision(decision), true);
    assert.equal(isValidConsentDecision(decision.toUpperCase()), true);
  }

  // Invalid decisions
  assert.equal(isValidConsentDecision("partial"), false);
  assert.equal(isValidConsentDecision("pending"), false);
  assert.equal(isValidConsentDecision("rejected_all"), false);
  assert.equal(isValidConsentDecision(""), false);
  assert.equal(isValidConsentDecision(null), false);
  assert.equal(isValidConsentDecision(42), false);
});

test("sanitizeSearchQuery — strips wildcards, control characters, and enforces length", () => {
  assert.equal(sanitizeSearchQuery("anon-sess-12345"), "anon-sess-12345");
  assert.equal(sanitizeSearchQuery("c748fa71-55db-4414"), "c748fa71-55db-4414");

  // Strips SQL and PostgREST injection characters
  assert.equal(sanitizeSearchQuery("session%hack_token"), "session hack token");
  assert.equal(sanitizeSearchQuery("inject(select,now)"), "inject select now");
  assert.equal(sanitizeSearchQuery("   padded_session   "), "padded session");

  // Enforces max length 100
  const longQuery = "a".repeat(200);
  const sanitized = sanitizeSearchQuery(longQuery);
  assert.equal(sanitized.length, 100);

  // Non-strings
  assert.equal(sanitizeSearchQuery(null), "");
  assert.equal(sanitizeSearchQuery(undefined), "");
  assert.equal(sanitizeSearchQuery(123), "");
});

test("calculatePagination — calculates correct ranges, offsets, and boundary caps", () => {
  // Default values
  const defaultPag = calculatePagination();
  assert.equal(defaultPag.page, 1);
  assert.equal(defaultPag.pageSize, 10);
  assert.equal(defaultPag.from, 0);
  assert.equal(defaultPag.to, 9);
  assert.equal(defaultPag.calculateTotalPages(25), 3);
  assert.equal(defaultPag.calculateTotalPages(0), 1);

  // Custom page and pageSize
  const customPag = calculatePagination({ page: 3, pageSize: 20 });
  assert.equal(customPag.page, 3);
  assert.equal(customPag.pageSize, 20);
  assert.equal(customPag.from, 40);
  assert.equal(customPag.to, 59);
  assert.equal(customPag.calculateTotalPages(45), 3);

  // Max page size clamp (50)
  const clampedPag = calculatePagination({ page: 1, pageSize: 500 });
  assert.equal(clampedPag.pageSize, 50);

  // Malformed inputs fallback safely
  const invalidPag = calculatePagination({ page: -5, pageSize: "not-a-number" });
  assert.equal(invalidPag.page, 1);
  assert.equal(invalidPag.pageSize, 10);
});

test("Consent audit immutability invariant — verifies read-only tracking posture", () => {
  // Confirm that the consent tracking module does NOT expose mutable actions,
  // honoring the database migration where only SELECT is permitted under RLS.
  // There should be no actions.ts in lib/consent-tracking.
  let hasActionsFile = false;
  try {
    // Attempting to import non-existent actions must fail
    require.resolve("../lib/consent-tracking/actions.ts");
    hasActionsFile = true;
  } catch {
    hasActionsFile = false;
  }
  assert.equal(hasActionsFile, false, "Consent Tracking must remain strictly read-only audit log.");
});
