import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ServiceCategory, BudgetTier, ServiceEnquiryStatus } from "@/lib/supabase/types";
import {
  isValidServiceEnquiryStatus,
  isValidServiceCategory,
  isValidUUID,
  sanitizeSearchQuery,
} from "./validation";

export interface ServiceEnquiryWithFounder {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  service_category: ServiceCategory;
  budget_tier: BudgetTier | null;
  project_description: string;
  estimated_timeline: string | null;
  status: ServiceEnquiryStatus;
  internal_notes: string | null;
  assigned_founder: string | null;
  created_at: string;
  updated_at: string;
  assigned_founder_profile?: {
    full_name: string;
    email: string;
  } | null;
}

export interface GetServiceEnquiriesParams {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "newest" | "oldest";
}

export interface ServiceEnquiriesListResult {
  enquiries: ServiceEnquiryWithFounder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

export interface ServiceEnquiryStatusCounts {
  all: number;
  new: number;
  contacted: number;
  discovery_scheduled: number;
  proposal_sent: number;
  closed_won: number;
  closed_lost: number;
  archived: number;
  error: string | null;
}

/**
 * Retrieves paginated, filtered service enquiries using the authenticated Supabase client.
 * Enforces row-level security and bounded queries.
 */
export async function getServiceEnquiriesList(
  supabase: SupabaseClient<Database>,
  params: GetServiceEnquiriesParams = {}
): Promise<ServiceEnquiriesListResult> {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(params.pageSize) || 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("service_enquiries")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        company_name,
        service_category,
        budget_tier,
        project_description,
        estimated_timeline,
        status,
        internal_notes,
        assigned_founder,
        created_at,
        updated_at,
        assigned_founder_profile:founder_profiles!service_enquiries_assigned_founder_fkey(full_name, email)
      `,
        { count: "exact" }
      );

    // 1. Status Filter
    if (params.status && params.status !== "all" && isValidServiceEnquiryStatus(params.status)) {
      query = query.eq("status", params.status);
    }

    // 2. Service Category Filter
    if (params.category && params.category !== "all" && isValidServiceCategory(params.category)) {
      query = query.eq("service_category", params.category);
    }

    // 3. Search Filter (searches full_name, email, company_name, project_description safely)
    const sanitizedSearch = sanitizeSearchQuery(params.search);
    if (sanitizedSearch) {
      const orFilter = [
        `full_name.ilike.%${sanitizedSearch}%`,
        `email.ilike.%${sanitizedSearch}%`,
        `company_name.ilike.%${sanitizedSearch}%`,
        `project_description.ilike.%${sanitizedSearch}%`,
      ].join(",");
      query = query.or(orFilter);
    }

    // 4. Sorting
    switch (params.sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // 5. Bounded pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return {
        enquiries: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
        error: error.message ?? "Failed to retrieve service enquiries.",
      };
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      enquiries: (data as unknown as ServiceEnquiryWithFounder[]) ?? [],
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
 * Retrieves a single service enquiry by ID with assigned founder details.
 */
export async function getServiceEnquiryById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<{ enquiry: ServiceEnquiryWithFounder | null; error: string | null }> {
  if (!isValidUUID(id)) {
    return { enquiry: null, error: "Invalid service enquiry ID format." };
  }

  try {
    const { data, error } = await supabase
      .from("service_enquiries")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        company_name,
        service_category,
        budget_tier,
        project_description,
        estimated_timeline,
        status,
        internal_notes,
        assigned_founder,
        created_at,
        updated_at,
        assigned_founder_profile:founder_profiles!service_enquiries_assigned_founder_fkey(full_name, email)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { enquiry: null, error: error.message ?? "Failed to fetch service enquiry details." };
    }

    return { enquiry: (data as unknown as ServiceEnquiryWithFounder) ?? null, error: null };
  } catch (err) {
    return {
      enquiry: null,
      error: err instanceof Error ? err.message : "Unexpected database error.",
    };
  }
}

/**
 * Retrieves counts for each service enquiry status to power filter tabs.
 */
export async function getServiceEnquiryStatusCounts(
  supabase: SupabaseClient<Database>
): Promise<ServiceEnquiryStatusCounts> {
  try {
    const [
      allRes,
      newRes,
      contactedRes,
      discoveryRes,
      proposalRes,
      wonRes,
      lostRes,
      archivedRes,
    ] = await Promise.all([
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "contacted"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "discovery_scheduled"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "proposal_sent"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "closed_won"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "closed_lost"),
      supabase.from("service_enquiries").select("*", { count: "exact", head: true }).eq("status", "archived"),
    ]);

    const hasError =
      allRes.error ||
      newRes.error ||
      contactedRes.error ||
      discoveryRes.error ||
      proposalRes.error ||
      wonRes.error ||
      lostRes.error ||
      archivedRes.error;

    return {
      all: allRes.count ?? 0,
      new: newRes.count ?? 0,
      contacted: contactedRes.count ?? 0,
      discovery_scheduled: discoveryRes.count ?? 0,
      proposal_sent: proposalRes.count ?? 0,
      closed_won: wonRes.count ?? 0,
      closed_lost: lostRes.count ?? 0,
      archived: archivedRes.count ?? 0,
      error: hasError ? "Some status counts could not be queried." : null,
    };
  } catch {
    return {
      all: 0,
      new: 0,
      contacted: 0,
      discovery_scheduled: 0,
      proposal_sent: 0,
      closed_won: 0,
      closed_lost: 0,
      archived: 0,
      error: "Failed to query service enquiry counts.",
    };
  }
}
