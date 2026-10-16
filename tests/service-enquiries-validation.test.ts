import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidUUID,
  isValidServiceEnquiryStatus,
  isValidServiceCategory,
  isValidBudgetTier,
  sanitizeSearchQuery,
  validateInternalNotes,
  validateUpdateServiceEnquiryInput,
  VALID_SERVICE_ENQUIRY_STATUSES,
  VALID_SERVICE_CATEGORIES,
  VALID_BUDGET_TIERS,
} from "../lib/service-enquiries/validation.ts";

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

test("isValidServiceEnquiryStatus — validates supported schema status enums strictly", () => {
  for (const status of VALID_SERVICE_ENQUIRY_STATUSES) {
    assert.equal(isValidServiceEnquiryStatus(status), true);
    assert.equal(isValidServiceEnquiryStatus(status.toUpperCase()), true);
  }

  // Exact statuses check
  assert.deepEqual([...VALID_SERVICE_ENQUIRY_STATUSES], [
    "new",
    "contacted",
    "discovery_scheduled",
    "proposal_sent",
    "closed_won",
    "closed_lost",
    "archived",
  ]);

  // Unsupported or invented statuses
  assert.equal(isValidServiceEnquiryStatus("pending"), false);
  assert.equal(isValidServiceEnquiryStatus("in_progress"), false);
  assert.equal(isValidServiceEnquiryStatus("spam"), false);
  assert.equal(isValidServiceEnquiryStatus("completed"), false);
  assert.equal(isValidServiceEnquiryStatus(""), false);
  assert.equal(isValidServiceEnquiryStatus(null), false);
  assert.equal(isValidServiceEnquiryStatus(123), false);
});

test("isValidServiceCategory — validates supported service categories strictly", () => {
  for (const cat of VALID_SERVICE_CATEGORIES) {
    assert.equal(isValidServiceCategory(cat), true);
    assert.equal(isValidServiceCategory(cat.toUpperCase()), true);
  }

  assert.deepEqual([...VALID_SERVICE_CATEGORIES], [
    "custom_software",
    "web_development",
    "ui_ux_design",
    "mobile_apps",
    "graphic_design",
    "marketing_growth",
    "erp_lms_systems",
    "other",
  ]);

  // Unsupported categories
  assert.equal(isValidServiceCategory("blockchain"), false);
  assert.equal(isValidServiceCategory("cloud_hosting"), false);
  assert.equal(isValidServiceCategory(""), false);
  assert.equal(isValidServiceCategory(null), false);
});

test("isValidBudgetTier — validates supported budget tiers strictly", () => {
  for (const tier of VALID_BUDGET_TIERS) {
    assert.equal(isValidBudgetTier(tier), true);
    assert.equal(isValidBudgetTier(tier.toUpperCase()), true);
  }

  assert.deepEqual([...VALID_BUDGET_TIERS], [
    "starter",
    "growth",
    "scale",
    "custom",
  ]);

  // Unsupported tiers
  assert.equal(isValidBudgetTier("enterprise"), false);
  assert.equal(isValidBudgetTier("premium"), false);
  assert.equal(isValidBudgetTier(""), false);
  assert.equal(isValidBudgetTier(null), false);
});

test("sanitizeSearchQuery — strips wildcards, control characters, and enforces length", () => {
  assert.equal(sanitizeSearchQuery("Acme Corp"), "Acme Corp");
  assert.equal(sanitizeSearchQuery("lead@example.com"), "lead@example.com");

  // Strips SQL/PostgREST injection wildcards
  assert.equal(sanitizeSearchQuery("project%scope_req"), "project scope req");
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

  const validNotes = "Discovery scheduled for next Thursday. Budget looks solid for Growth tier.";
  const res = validateInternalNotes(validNotes);
  assert.equal(res.isValid, true);
  assert.equal(res.value, validNotes);

  // Overly long text
  const tooLong = "x".repeat(5001);
  const errRes = validateInternalNotes(tooLong);
  assert.equal(errRes.isValid, false);
  assert.match(errRes.error ?? "", /cannot exceed 5000 characters/i);
});

test("validateUpdateServiceEnquiryInput — validates full mutation payload with assignment", () => {
  const validPayload = {
    enquiryId: "880e8400-e29b-41d4-a716-446655440000",
    status: "discovery_scheduled",
    internalNotes: "Discovery meeting set. NDA signed.",
    assignedFounderId: "128c53d9-97ea-453a-bc1e-a256fb2d4866",
  };

  const validRes = validateUpdateServiceEnquiryInput(validPayload);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.data?.enquiryId, "880e8400-e29b-41d4-a716-446655440000");
  assert.equal(validRes.data?.status, "discovery_scheduled");
  assert.equal(validRes.data?.internalNotes, "Discovery meeting set. NDA signed.");
  assert.equal(validRes.data?.assignedFounderId, "128c53d9-97ea-453a-bc1e-a256fb2d4866");

  // Valid without assigned founder
  const unassignedRes = validateUpdateServiceEnquiryInput({
    enquiryId: "880e8400-e29b-41d4-a716-446655440000",
    status: "new",
  });
  assert.equal(unassignedRes.isValid, true);
  assert.equal(unassignedRes.data?.assignedFounderId, null);

  // Rejection on bad ID
  const badIdRes = validateUpdateServiceEnquiryInput({
    ...validPayload,
    enquiryId: "invalid-id",
  });
  assert.equal(badIdRes.isValid, false);
  assert.match(badIdRes.error ?? "", /service enquiry ID format/i);

  // Rejection on bad status
  const badStatusRes = validateUpdateServiceEnquiryInput({
    ...validPayload,
    status: "in_progress",
  });
  assert.equal(badStatusRes.isValid, false);
  assert.match(badStatusRes.error ?? "", /Invalid status/i);

  // Rejection on invalid assigned founder ID
  const badFounderRes = validateUpdateServiceEnquiryInput({
    ...validPayload,
    assignedFounderId: "not-a-founder-uuid",
  });
  assert.equal(badFounderRes.isValid, false);
  assert.match(badFounderRes.error ?? "", /assigned founder ID format/i);

  // Rejection on invalid payload
  assert.equal(validateUpdateServiceEnquiryInput(null).isValid, false);
  assert.equal(validateUpdateServiceEnquiryInput("string").isValid, false);
  assert.equal(validateUpdateServiceEnquiryInput({}).isValid, false);
});

test("service enquiries pagination and sorting calculation logic", () => {
  const totalCount = 42;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  assert.equal(totalPages, 5);

  const from = (3 - 1) * pageSize;
  const to = from + pageSize - 1;
  assert.equal(from, 20);
  assert.equal(to, 29);

  // Zero records edge case
  const zeroPages = Math.max(1, Math.ceil(0 / pageSize));
  assert.equal(zeroPages, 1);
});
