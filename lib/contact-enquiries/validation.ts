/**
 * Contact Enquiry Input Validation and Sanitization
 *
 * Strict server-side validation for contact enquiry filters,
 * identifiers, and status update payloads.
 */

import type { ContactEnquiryStatus } from "@/lib/supabase/types";

export const VALID_CONTACT_ENQUIRY_STATUSES: readonly ContactEnquiryStatus[] = [
  "new",
  "in_review",
  "responded",
  "archived",
  "spam",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidContactEnquiryStatus(status: unknown): status is ContactEnquiryStatus {
  if (typeof status !== "string") return false;
  return (VALID_CONTACT_ENQUIRY_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
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

export interface UpdateContactEnquiryPayload {
  enquiryId: string;
  status: ContactEnquiryStatus;
  internalNotes?: string | null;
}

export interface UpdateContactEnquiryValidationResult {
  isValid: boolean;
  data?: UpdateContactEnquiryPayload;
  error?: string;
}

export function validateUpdateContactEnquiryInput(input: unknown): UpdateContactEnquiryValidationResult {
  if (!input || typeof input !== "object") {
    return { isValid: false, error: "Invalid payload provided." };
  }

  const raw = input as Record<string, unknown>;

  if (!isValidUUID(raw.enquiryId)) {
    return { isValid: false, error: "Invalid contact enquiry ID format." };
  }

  if (!isValidContactEnquiryStatus(raw.status)) {
    return {
      isValid: false,
      error: `Invalid status. Must be one of: ${VALID_CONTACT_ENQUIRY_STATUSES.join(", ")}.`,
    };
  }

  const notesValidation = validateInternalNotes(raw.internalNotes);
  if (!notesValidation.isValid) {
    return { isValid: false, error: notesValidation.error };
  }

  return {
    isValid: true,
    data: {
      enquiryId: (raw.enquiryId as string).trim(),
      status: (raw.status as string).trim().toLowerCase() as ContactEnquiryStatus,
      internalNotes: notesValidation.value,
    },
  };
}
