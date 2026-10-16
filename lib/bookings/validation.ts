/**
 * Booking Request Input Validation and Sanitization
 *
 * Strict server-side validation for booking request filters,
 * identifiers, and status update payloads.
 */

import type { BookingStatus } from "@/lib/supabase/types";

export const VALID_BOOKING_STATUSES: readonly BookingStatus[] = [
  "pending",
  "confirmed",
  "rescheduled",
  "cancelled",
  "completed",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidBookingStatus(status: unknown): status is BookingStatus {
  if (typeof status !== "string") return false;
  return (VALID_BOOKING_STATUSES as readonly string[]).includes(status.trim().toLowerCase());
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

export interface UpdateBookingPayload {
  bookingId: string;
  status: BookingStatus;
  internalNotes?: string | null;
}

export interface UpdateBookingValidationResult {
  isValid: boolean;
  data?: UpdateBookingPayload;
  error?: string;
}

export function validateUpdateBookingInput(input: unknown): UpdateBookingValidationResult {
  if (!input || typeof input !== "object") {
    return { isValid: false, error: "Invalid payload provided." };
  }

  const raw = input as Record<string, unknown>;

  if (!isValidUUID(raw.bookingId)) {
    return { isValid: false, error: "Invalid booking ID format." };
  }

  if (!isValidBookingStatus(raw.status)) {
    return {
      isValid: false,
      error: `Invalid status. Must be one of: ${VALID_BOOKING_STATUSES.join(", ")}.`,
    };
  }

  const notesValidation = validateInternalNotes(raw.internalNotes);
  if (!notesValidation.isValid) {
    return { isValid: false, error: notesValidation.error };
  }

  return {
    isValid: true,
    data: {
      bookingId: (raw.bookingId as string).trim(),
      status: (raw.status as string).trim().toLowerCase() as BookingStatus,
      internalNotes: notesValidation.value,
    },
  };
}
