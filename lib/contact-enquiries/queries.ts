import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ContactEnquiryStatus } from "@/lib/supabase/types";
import { isValidContactEnquiryStatus, isValidUUID, sanitizeSearchQuery } from "./validation";

export interface ContactEnquiryWithFounder {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  subject: string | null;
  message: string;
  status: ContactEnquiryStatus;
  internal_notes: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  responded_by_founder?: {
    full_name: string;
    email: string;
  } | null;
}

export interface GetContactEnquiriesParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "newest" | "oldest";
}

export interface ContactEnquiriesListResult {
  enquiries: ContactEnquiryWithFounder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

export interface ContactEnquiryStatusCounts {
  all: number;
  new: number;
  in_review: number;
  responded: number;
  archived: number;
  spam: number;
  error: string | null;
}

/**
 * Retrieves paginated, filtered contact enquiries using the authenticated Supabase client.
 * Enforces row-level security and bounded queries.
 */
export async function getContactEnquiriesList(
  supabase: SupabaseClient<Database>,
  params: GetContactEnquiriesParams = {}
): Promise<ContactEnquiriesListResult> {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(params.pageSize) || 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("contact_enquiries")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        company_name,
        subject,
        message,
        status,
        internal_notes,
        responded_by,
        responded_at,
        created_at,
        updated_at,
        responded_by_founder:founder_profiles!contact_enquiries_responded_by_fkey(full_name, email)
      `,
        { count: "exact" }
      );

    // 1. Status Filter
    if (params.status && params.status !== "all" && isValidContactEnquiryStatus(params.status)) {
      query = query.eq("status", params.status);
    }

    // 2. Search Filter (searches full_name, email, subject, message safely)
    const sanitizedSearch = sanitizeSearchQuery(params.search);
    if (sanitizedSearch) {
      const orFilter = [
        `full_name.ilike.%${sanitizedSearch}%`,
        `email.ilike.%${sanitizedSearch}%`,
        `subject.ilike.%${sanitizedSearch}%`,
        `message.ilike.%${sanitizedSearch}%`,
      ].join(",");
      query = query.or(orFilter);
    }

    // 3. Sorting
    switch (params.sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // 4. Bounded pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return {
        enquiries: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
        error: error.message ?? "Failed to retrieve contact enquiries.",
      };
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      enquiries: (data as unknown as ContactEnquiryWithFounder[]) ?? [],
      totalCount,
      page,
      pageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    return {
      enquiries: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
      error: err instanceof Error ? err.message : "Unexpected database error.",
    };
  }
}

/**
 * Retrieves a single contact enquiry by ID with founder responder details.
 */
export async function getContactEnquiryById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<{ enquiry: ContactEnquiryWithFounder | null; error: string | null }> {
  if (!isValidUUID(id)) {
    return { enquiry: null, error: "Invalid contact enquiry ID format." };
  }

  try {
    const { data, error } = await supabase
      .from("contact_enquiries")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        company_name,
        subject,
        message,
        status,
        internal_notes,
        responded_by,
        responded_at,
        created_at,
        updated_at,
        responded_by_founder:founder_profiles!contact_enquiries_responded_by_fkey(full_name, email)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { enquiry: null, error: error.message ?? "Failed to fetch contact enquiry details." };
    }

    return { enquiry: (data as unknown as ContactEnquiryWithFounder) ?? null, error: null };
  } catch (err) {
    return {
      enquiry: null,
      error: err instanceof Error ? err.message : "Unexpected database error.",
    };
  }
}

/**
 * Retrieves counts for each contact enquiry status to power filter tabs.
 */
export async function getContactEnquiryStatusCounts(
  supabase: SupabaseClient<Database>
): Promise<ContactEnquiryStatusCounts> {
  try {
    const [allRes, newRes, inReviewRes, respondedRes, archivedRes, spamRes] =
      await Promise.all([
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }),
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }).eq("status", "in_review"),
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }).eq("status", "responded"),
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }).eq("status", "archived"),
        supabase.from("contact_enquiries").select("*", { count: "exact", head: true }).eq("status", "spam"),
      ]);

    const hasError =
      allRes.error ||
      newRes.error ||
      inReviewRes.error ||
      respondedRes.error ||
      archivedRes.error ||
      spamRes.error;

    return {
      all: allRes.count ?? 0,
      new: newRes.count ?? 0,
      in_review: inReviewRes.count ?? 0,
      responded: respondedRes.count ?? 0,
      archived: archivedRes.count ?? 0,
      spam: spamRes.count ?? 0,
      error: hasError ? "Some status counts could not be queried." : null,
    };
  } catch {
    return {
      all: 0,
      new: 0,
      in_review: 0,
      responded: 0,
      archived: 0,
      spam: 0,
      error: "Failed to query contact enquiry counts.",
    };
  }
}
