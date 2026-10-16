import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidUUID,
  isValidBookingStatus,
  sanitizeSearchQuery,
  validateInternalNotes,
  validateUpdateBookingInput,
  VALID_BOOKING_STATUSES,
} from "../lib/bookings/validation.ts";

test("isValidUUID — accepts valid UUID formats and rejects invalid ones", () => {
  const validV4 = "550e8400-e29b-41d4-a716-446655440000";
  const validV1 = "e3b0c442-98fc-11e9-a2a3-2a2ae2dbcce4";
  assert.equal(isValidUUID(validV4), true);
  assert.equal(isValidUUID(validV1), true);
  assert.equal(isValidUUID(`  ${validV4}  `), true);

  // Invalid UUIDs
  assert.equal(isValidUUID("not-a-uuid"), false);
  assert.equal(isValidUUID("550e8400-e29b-41d4-a716"), false);
  assert.equal(isValidUUID(""), false);
  assert.equal(isValidUUID(null), false);
  assert.equal(isValidUUID(undefined), false);
  assert.equal(isValidUUID("550e8400-e29b-41d4-a716-446655440000; DROP TABLE users;"), false);
});

test("isValidBookingStatus — validates supported schema status enums strictly", () => {
  for (const status of VALID_BOOKING_STATUSES) {
    assert.equal(isValidBookingStatus(status), true);
    assert.equal(isValidBookingStatus(status.toUpperCase()), true);
  }

  // Unsupported or invented statuses
  assert.equal(isValidBookingStatus("in_progress"), false);
  assert.equal(isValidBookingStatus("draft"), false);
  assert.equal(isValidBookingStatus("approved"), false);
  assert.equal(isValidBookingStatus("active"), false);
  assert.equal(isValidBookingStatus(""), false);
  assert.equal(isValidBookingStatus(null), false);
  assert.equal(isValidBookingStatus(123), false);
});

test("sanitizeSearchQuery — strips wildcards, control characters, and enforces length", () => {
  assert.equal(sanitizeSearchQuery("founder@dezprox.com"), "founder@dezprox.com");
  assert.equal(sanitizeSearchQuery("  +91 9876543210  "), "+91 9876543210");

  // Strips SQL/PostgREST injection wildcards
  assert.equal(sanitizeSearchQuery("test%user_name"), "test user name");
  assert.equal(sanitizeSearchQuery("evil(select,now)"), "evil select now");

  // Handles long queries
  const longQuery = "a".repeat(200);
  assert.equal(sanitizeSearchQuery(longQuery).length, 100);

  // Non-strings
  assert.equal(sanitizeSearchQuery(null), "");
  assert.equal(sanitizeSearchQuery(undefined), "");
  assert.equal(sanitizeSearchQuery(123), "");
});

test("validateInternalNotes — validates text boundaries and converts empty notes to null", () => {
  assert.equal(validateInternalNotes(null).value, null);
  assert.equal(validateInternalNotes(undefined).value, null);
  assert.equal(validateInternalNotes("").value, null);
  assert.equal(validateInternalNotes("   ").value, null);

  const validNotes = "Spoke with client. Confirmed slot for next Tuesday.";
  const res = validateInternalNotes(validNotes);
  assert.equal(res.isValid, true);
  assert.equal(res.value, validNotes);

  // Overly long text
  const tooLong = "x".repeat(5001);
  const errRes = validateInternalNotes(tooLong);
  assert.equal(errRes.isValid, false);
  assert.match(errRes.error ?? "", /cannot exceed 5000 characters/i);
});

test("validateUpdateBookingInput — validates full mutation payload", () => {
  const validPayload = {
    bookingId: "550e8400-e29b-41d4-a716-446655440000",
    status: "confirmed",
    internalNotes: "Confirmed and calendar invite sent.",
  };

  const validRes = validateUpdateBookingInput(validPayload);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.data?.bookingId, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(validRes.data?.status, "confirmed");
  assert.equal(validRes.data?.internalNotes, "Confirmed and calendar invite sent.");

  // Rejection on bad ID
  const badIdRes = validateUpdateBookingInput({
    ...validPayload,
    bookingId: "bad-id",
  });
  assert.equal(badIdRes.isValid, false);
  assert.match(badIdRes.error ?? "", /booking ID format/i);

  // Rejection on bad status
  const badStatusRes = validateUpdateBookingInput({
    ...validPayload,
    status: "invalid-status-name",
  });
  assert.equal(badStatusRes.isValid, false);
  assert.match(badStatusRes.error ?? "", /Invalid status/i);

  // Rejection on invalid payload
  assert.equal(validateUpdateBookingInput(null).isValid, false);
  assert.equal(validateUpdateBookingInput("string").isValid, false);
});
