"use server";

import { revalidatePath } from "next/cache";
import { assertActiveFounder } from "@/lib/supabase/founder";
import { validateUpdateServiceEnquiryInput } from "./validation";
import type { ServiceEnquiryStatus } from "@/lib/supabase/types";

export interface UpdateServiceEnquiryActionState {
  success: boolean;
  error: string | null;
}

/**
 * Server Action to update a service/project enquiry's status, internal notes, and assigned founder.
 *
 * Enforces authoritative defense-in-depth:
 * 1. Cryptographically verifies current active founder authorization via assertActiveFounder().
 * 2. Strictly validates enquiryId, allowed status enum, and note lengths server-side.
 * 3. Updates assigned_founder when requested or assigned to the active founder.
 * 4. Operates strictly under user's session with Supabase Row Level Security (RLS).
 * 5. Revalidates dashboard cache to immediately reflect updates across all views.
 */
export async function updateServiceEnquiryAction(
  _prevState: UpdateServiceEnquiryActionState,
  formData: FormData
): Promise<UpdateServiceEnquiryActionState> {
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
  const rawAssignToMe = formData.get("assignToMe");
  const rawAssignedFounderId = formData.get("assignedFounderId");

  let targetFounderId: string | null = null;
  if (rawAssignToMe === "true" || rawAssignToMe === "on") {
    targetFounderId = auth.founder.id;
  } else if (rawAssignedFounderId === "unassigned") {
    targetFounderId = null;
  } else if (typeof rawAssignedFounderId === "string" && rawAssignedFounderId.trim() !== "") {
    targetFounderId = rawAssignedFounderId.trim();
  }

  const validation = validateUpdateServiceEnquiryInput({
    enquiryId: rawEnquiryId,
    status: rawStatus,
    internalNotes: rawInternalNotes,
    assignedFounderId: targetFounderId,
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
    status: ServiceEnquiryStatus;
    internal_notes?: string | null;
    assigned_founder?: string | null;
  } = {
    status,
  };

  if (internalNotes !== undefined) {
    updatePayload.internal_notes = internalNotes;
  }

  if (rawAssignToMe === "true" || rawAssignToMe === "on") {
    updatePayload.assigned_founder = auth.founder.id;
  } else if (rawAssignedFounderId === "unassigned") {
    updatePayload.assigned_founder = null;
  } else if (validation.data.assignedFounderId !== undefined) {
    updatePayload.assigned_founder = validation.data.assignedFounderId;
  }

  // 4. Execute update against database using caller's authenticated RLS session
  const { error: updateError } = await auth.supabase
    .from("service_enquiries")
    .update(updatePayload)
    .eq("id", enquiryId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "Failed to update service enquiry.",
    };
  }

  // 5. Revalidate affected views
  revalidatePath("/dashboard/service-enquiries");
  revalidatePath("/dashboard");

  return {
    success: true,
    error: null,
  };
}
