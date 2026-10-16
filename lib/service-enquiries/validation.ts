/**
 * Service & Project Enquiry Input Validation and Sanitization
 *
 * Strict server-side validation for service enquiry filters,
 * identifiers, categories, budget tiers, and status update payloads.
 */

import type { ServiceCategory, BudgetTier, ServiceEnquiryStatus } from "@/lib/supabase/types";

export const VALID_SERVICE_ENQUIRY_STATUSES: readonly ServiceEnquiryStatus[] = [
  "new",
  "contacted",
  "discovery_scheduled",
  "proposal_sent",
  "closed_won",
  "closed_lost",
  "archived",
] as const;

export const VALID_SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  "custom_software",
  "web_development",
  "ui_ux_design",
  "mobile_apps",
  "graphic_design",
  "marketing_growth",
  "erp_lms_systems",
  "other",
] as const;

export const VALID_BUDGET_TIERS: readonly BudgetTier[] = [
  "starter",
  "growth",
  "scale",
  "custom",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidServiceEnquiryStatus(status: unknown): status is ServiceEnquiryStatus {
  if (typeof status !== "string") return false;
  return (VALID_SERVICE_ENQUIRY_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
}

export function isValidServiceCategory(category: unknown): category is ServiceCategory {
  if (typeof category !== "string") return false;
  return (VALID_SERVICE_CATEGORIES as readonly string[]).includes(category.trim().toLowerCase());
}

export function isValidBudgetTier(tier: unknown): tier is BudgetTier {
  if (typeof tier !== "string") return false;
  return (VALID_BUDGET_TIERS as readonly string[]).includes(tier.trim().toLowerCase());
}

export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== "string") return "";
  // Strip control characters, excessive whitespace, and SQL/PostgREST injection tokens
  return query
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[%_,()]/g, " ")
    .trim()
    .slice(0, 100);
}

export function validateInternalNotes(notes: unknown): {
  isValid: boolean;
  value: string | null;
  error?: string;
} {
  if (notes === undefined || notes === null) {
    return { isValid: true, value: null };
  }
  if (typeof notes !== "string") {
    return { isValid: false, value: null, error: "Internal notes must be text." };
  }
  const trimmed = notes.trim();
  if (trimmed.length > 5000) {
    return {
      isValid: false,
      value: null,
      error: "Internal notes cannot exceed 5000 characters.",
    };
  }
  return { isValid: true, value: trimmed === "" ? null : trimmed };
}

export interface UpdateServiceEnquiryPayload {
  enquiryId: string;
  status: ServiceEnquiryStatus;
  internalNotes?: string | null;
  assignedFounderId?: string | null;
}

export interface UpdateServiceEnquiryValidationResult {
  isValid: boolean;
  data?: UpdateServiceEnquiryPayload;
  error?: string;
}

export function validateUpdateServiceEnquiryInput(input: unknown): UpdateServiceEnquiryValidationResult {
  if (!input || typeof input !== "object") {
    return { isValid: false, error: "Invalid payload provided." };
  }

  const raw = input as Record<string, unknown>;

  if (!isValidUUID(raw.enquiryId)) {
    return { isValid: false, error: "Invalid service enquiry ID format." };
  }

  if (!isValidServiceEnquiryStatus(raw.status)) {
    return {
      isValid: false,
      error: `Invalid status. Must be one of: ${VALID_SERVICE_ENQUIRY_STATUSES.join(", ")}.`,
    };
  }

  const notesValidation = validateInternalNotes(raw.internalNotes);
  if (!notesValidation.isValid) {
    return { isValid: false, error: notesValidation.error };
  }

  let assignedFounderId: string | null = null;
  if (raw.assignedFounderId !== undefined && raw.assignedFounderId !== null && raw.assignedFounderId !== "") {
    if (!isValidUUID(raw.assignedFounderId)) {
      return { isValid: false, error: "Invalid assigned founder ID format." };
    }
    assignedFounderId = (raw.assignedFounderId as string).trim();
  }

  return {
    isValid: true,
    data: {
      enquiryId: (raw.enquiryId as string).trim(),
      status: (raw.status as string).trim().toLowerCase() as ServiceEnquiryStatus,
      internalNotes: notesValidation.value,
      assignedFounderId,
    },
  };
}
