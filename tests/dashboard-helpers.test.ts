import test from "node:test";
import assert from "node:assert/strict";
import {
  formatStatusBadge,
  formatServiceCategory,
  formatBudgetTier,
  formatDateTime,
  formatDateOnly,
  buildUnifiedActivity,
} from "../lib/dashboard/formatters.ts";

test("formatStatusBadge — handles pending, new, and other statuses", () => {
  const pending = formatStatusBadge("pending");
  assert.equal(pending.label, "Pending");
  assert.match(pending.badgeClass, /amber/);

  const newStatus = formatStatusBadge("new");
  assert.equal(newStatus.label, "New");
  assert.match(newStatus.badgeClass, /emerald/);

  const confirmed = formatStatusBadge("confirmed");
  assert.equal(confirmed.label, "Confirmed");
  assert.match(confirmed.badgeClass, /emerald/);

  const inReview = formatStatusBadge("in_review");
  assert.equal(inReview.label, "In Review");
  assert.match(inReview.badgeClass, /blue/);

  const discovery = formatStatusBadge("discovery_scheduled");
  assert.equal(discovery.label, "Discovery Scheduled");
  assert.match(discovery.badgeClass, /cyan/);

  const proposal = formatStatusBadge("proposal_sent");
  assert.equal(proposal.label, "Proposal Sent");
  assert.match(proposal.badgeClass, /purple/);

  const spam = formatStatusBadge("spam");
  assert.equal(spam.label, "Spam");
  assert.match(spam.badgeClass, /red/);
});

test("formatServiceCategory — converts enum strings to human-readable labels", () => {
  assert.equal(formatServiceCategory("custom_software"), "Custom Software");
  assert.equal(formatServiceCategory("web_development"), "Web Development");
  assert.equal(formatServiceCategory("ui_ux_design"), "UI/UX Design");
  assert.equal(formatServiceCategory("mobile_apps"), "Mobile Apps");
  assert.equal(formatServiceCategory("erp_lms_systems"), "ERP & LMS Systems");
  assert.equal(formatServiceCategory("marketing_growth"), "Marketing & Growth");
  assert.equal(formatServiceCategory("other"), "General / Other");
});

test("formatBudgetTier — formats budget tiers correctly", () => {
  assert.equal(formatBudgetTier(null), "Not specified");
  assert.equal(formatBudgetTier("starter"), "Starter Tier");
  assert.equal(formatBudgetTier("growth"), "Growth Tier");
  assert.equal(formatBudgetTier("scale"), "Scale Tier");
  assert.equal(formatBudgetTier("custom"), "Custom Tier");
});

test("formatDateTime and formatDateOnly — handles ISO strings gracefully", () => {
  const validIso = "2026-10-15T14:30:00.000Z";
  const formatted = formatDateTime(validIso);
  assert.notEqual(formatted, "Unknown date");

  const dateOnly = formatDateOnly("2026-10-20");
  assert.notEqual(dateOnly, "");

  assert.equal(formatDateTime("invalid-date"), "Unknown date");
});

test("buildUnifiedActivity — compiles and sorts submissions chronologically descending", () => {
  const activity = buildUnifiedActivity({
    bookings: [
      {
        id: "b-1",
        email: "client1@dezprox.com",
        phone: "+91 9876543210",
        requested_date: "2026-10-20",
        requested_time_slot: "14:00 - 15:00",
        status: "pending",
        created_at: "2026-10-15T10:00:00.000Z",
      },
    ],
    contacts: [
      {
        id: "c-1",
        full_name: "Jane Doe",
        email: "jane@company.com",
        subject: "Enterprise Partnership",
        status: "new",
        created_at: "2026-10-15T12:00:00.000Z",
      },
    ],
    services: [
      {
        id: "s-1",
        full_name: "John Smith",
        email: "john@tech.io",
        service_category: "web_development",
        budget_tier: "growth",
        status: "new",
        created_at: "2026-10-15T11:00:00.000Z",
      },
    ],
  });

  assert.equal(activity.length, 3);
  // Chronological order: 12:00 (contact), 11:00 (service), 10:00 (booking)
  assert.equal(activity[0].id, "c-1");
  assert.equal(activity[0].type, "contact");
  assert.equal(activity[1].id, "s-1");
  assert.equal(activity[1].type, "service");
  assert.equal(activity[2].id, "b-1");
  assert.equal(activity[2].type, "booking");
});
