"use server";

import { revalidatePath } from "next/cache";
import { assertActiveFounder } from "@/lib/supabase/founder";
import { validateUpdateBookingInput } from "./validation";
import type { BookingStatus } from "@/lib/supabase/types";

export interface UpdateBookingActionState {
  success: boolean;
  error: string | null;
}

/**
 * Server Action to update a booking request's status and internal notes.
 *
 * Enforces authoritative defense-in-depth:
 * 1. Cryptographically verifies current active founder authorization via assertActiveFounder().
 * 2. Strictly validates bookingId, allowed status enum, and note lengths server-side.
 * 3. Sets confirmed_by and confirmed_at when status transitions to 'confirmed'.
 * 4. Operates strictly under user's session with Supabase Row Level Security (RLS).
 * 5. Revalidates dashboard cache to immediately reflect updates across all views.
 */
export async function updateBookingAction(
  _prevState: UpdateBookingActionState,
  formData: FormData
): Promise<UpdateBookingActionState> {
  // 1. Authoritative founder verification
  const auth = await assertActiveFounder();
  if (!auth.ok) {
    return {
      success: false,
      error: auth.error ?? "Access denied. Active founder privileges required.",
    };
  }

  // 2. Validate input
  const rawBookingId = formData.get("bookingId");
  const rawStatus = formData.get("status");
  const rawInternalNotes = formData.get("internalNotes");

  const validation = validateUpdateBookingInput({
    bookingId: rawBookingId,
    status: rawStatus,
    internalNotes: rawInternalNotes,
  });

  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: validation.error ?? "Validation failed.",
    };
  }

  const { bookingId, status, internalNotes } = validation.data;

  // 3. Prepare update payload
  const updatePayload: {
    status: BookingStatus;
    internal_notes?: string | null;
    confirmed_by?: string | null;
    confirmed_at?: string | null;
  } = {
    status,
  };

  if (internalNotes !== undefined) {
    updatePayload.internal_notes = internalNotes;
  }

  // Handle confirmation metadata tracking
  if (status === "confirmed") {
    updatePayload.confirmed_by = auth.founder.id;
    updatePayload.confirmed_at = new Date().toISOString();
  } else if (status === "pending" || status === "cancelled") {
    // If reverted to pending or cancelled, clear confirmation credentials
    updatePayload.confirmed_by = null;
    updatePayload.confirmed_at = null;
  }

  // 4. Execute update against database using caller's authenticated RLS session
  const { error: updateError } = await auth.supabase
    .from("booking_requests")
    .update(updatePayload)
    .eq("id", bookingId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "Failed to update booking status.",
    };
  }

  // 5. Revalidate affected views
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");

  return {
    success: true,
    error: null,
  };
}
