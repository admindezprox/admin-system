"use server";

import { revalidatePath } from "next/cache";
import { assertActiveFounder } from "@/lib/supabase/founder";
import { validateUpdateContactEnquiryInput } from "./validation";
import type { ContactEnquiryStatus } from "@/lib/supabase/types";

export interface UpdateContactEnquiryActionState {
  success: boolean;
  error: string | null;
}

/**
 * Server Action to update a contact enquiry's status and internal notes.
 *
 * Enforces authoritative defense-in-depth:
 * 1. Cryptographically verifies current active founder authorization via assertActiveFounder().
 * 2. Strictly validates enquiryId, allowed status enum, and note lengths server-side.
 * 3. Sets responded_by and responded_at when status transitions to 'responded'.
 * 4. Operates strictly under user's session with Supabase Row Level Security (RLS).
 * 5. Revalidates dashboard cache to immediately reflect updates across all views.
 */
export async function updateContactEnquiryAction(
  _prevState: UpdateContactEnquiryActionState,
  formData: FormData
): Promise<UpdateContactEnquiryActionState> {
  // 1. Authoritative founder verification
  const auth = await assertActiveFounder();
  if (!auth.ok) {
    return {
      success: false,
      error: auth.error ?? "Access denied. Active founder privileges required.",
    };
  }

  // 2. Validate input
  const rawEnquiryId = formData.get("enquiryId");
  const rawStatus = formData.get("status");
  const rawInternalNotes = formData.get("internalNotes");

  const validation = validateUpdateContactEnquiryInput({
    enquiryId: rawEnquiryId,
    status: rawStatus,
    internalNotes: rawInternalNotes,
  });

  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      error: validation.error ?? "Validation failed.",
    };
  }

  const { enquiryId, status, internalNotes } = validation.data;

  // 3. Prepare update payload
  const updatePayload: {
    status: ContactEnquiryStatus;
    internal_notes?: string | null;
    responded_by?: string | null;
    responded_at?: string | null;
  } = {
    status,
  };

  if (internalNotes !== undefined) {
    updatePayload.internal_notes = internalNotes;
  }

  // Handle responded metadata tracking
  if (status === "responded") {
    updatePayload.responded_by = auth.founder.id;
    updatePayload.responded_at = new Date().toISOString();
  } else if (status === "new" || status === "spam") {
    // If reverted to new or flagged as spam, clear responded credentials
    updatePayload.responded_by = null;
    updatePayload.responded_at = null;
  }

  // 4. Execute update against database using caller's authenticated RLS session
  const { error: updateError } = await auth.supabase
    .from("contact_enquiries")
    .update(updatePayload)
    .eq("id", enquiryId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "Failed to update contact enquiry status.",
    };
  }

  // 5. Revalidate affected views
  revalidatePath("/dashboard/contact-enquiries");
  revalidatePath("/dashboard");

  return {
    success: true,
    error: null,
  };
}
