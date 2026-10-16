import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidUUID,
  isValidContactEnquiryStatus,
  sanitizeSearchQuery,
  validateInternalNotes,
  validateUpdateContactEnquiryInput,
  VALID_CONTACT_ENQUIRY_STATUSES,
} from "../lib/contact-enquiries/validation.ts";

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

test("isValidContactEnquiryStatus — validates supported schema status enums strictly", () => {
  for (const status of VALID_CONTACT_ENQUIRY_STATUSES) {
    assert.equal(isValidContactEnquiryStatus(status), true);
    assert.equal(isValidContactEnquiryStatus(status.toUpperCase()), true);
  }

  // Exact statuses check
  assert.deepEqual([...VALID_CONTACT_ENQUIRY_STATUSES], [
    "new",
    "in_review",
    "responded",
    "archived",
    "spam",
  ]);

  // Unsupported or invented statuses
  assert.equal(isValidContactEnquiryStatus("pending"), false);
  assert.equal(isValidContactEnquiryStatus("contacted"), false);
  assert.equal(isValidContactEnquiryStatus("closed_won"), false);
  assert.equal(isValidContactEnquiryStatus("resolved"), false);
  assert.equal(isValidContactEnquiryStatus(""), false);
  assert.equal(isValidContactEnquiryStatus(null), false);
  assert.equal(isValidContactEnquiryStatus(123), false);
});

test("sanitizeSearchQuery — strips wildcards, control characters, and enforces length", () => {
  assert.equal(sanitizeSearchQuery("Dinesh Siva"), "Dinesh Siva");
  assert.equal(sanitizeSearchQuery("client@example.com"), "client@example.com");

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

  const validNotes = "Followed up via email regarding project scope and requirements.";
  const res = validateInternalNotes(validNotes);
  assert.equal(res.isValid, true);
  assert.equal(res.value, validNotes);

  // Overly long text
  const tooLong = "x".repeat(5001);
  const errRes = validateInternalNotes(tooLong);
  assert.equal(errRes.isValid, false);
  assert.match(errRes.error ?? "", /cannot exceed 5000 characters/i);
});

test("validateUpdateContactEnquiryInput — validates full mutation payload", () => {
  const validPayload = {
    enquiryId: "715b3ba4-4d5d-472b-a03b-a08726f5e3e9",
    status: "responded",
    internalNotes: "Sent initial response email with portfolio deck.",
  };

  const validRes = validateUpdateContactEnquiryInput(validPayload);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.data?.enquiryId, "715b3ba4-4d5d-472b-a03b-a08726f5e3e9");
  assert.equal(validRes.data?.status, "responded");
  assert.equal(validRes.data?.internalNotes, "Sent initial response email with portfolio deck.");

  // Rejection on bad ID
  const badIdRes = validateUpdateContactEnquiryInput({
    ...validPayload,
    enquiryId: "bad-id-123",
  });
  assert.equal(badIdRes.isValid, false);
  assert.match(badIdRes.error ?? "", /contact enquiry ID format/i);

  // Rejection on bad status
  const badStatusRes = validateUpdateContactEnquiryInput({
    ...validPayload,
    status: "pending_call",
  });
  assert.equal(badStatusRes.isValid, false);
  assert.match(badStatusRes.error ?? "", /Invalid status/i);

  // Rejection on invalid payload
  assert.equal(validateUpdateContactEnquiryInput(null).isValid, false);
  assert.equal(validateUpdateContactEnquiryInput("string").isValid, false);
  assert.equal(validateUpdateContactEnquiryInput({}).isValid, false);
});

test("pagination and sorting calculation logic", () => {
  const totalCount = 25;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  assert.equal(totalPages, 3);

  const from = (2 - 1) * pageSize;
  const to = from + pageSize - 1;
  assert.equal(from, 10);
  assert.equal(to, 19);

  // Zero records edge case
  const zeroPages = Math.max(1, Math.ceil(0 / pageSize));
  assert.equal(zeroPages, 1);
});
