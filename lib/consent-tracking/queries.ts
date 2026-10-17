import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserAgentCategory } from "@/lib/supabase/types";
import {
  calculatePagination,
  isValidConsentDecision,
  isValidUserAgentCategory,
  isValidUUID,
  sanitizeSearchQuery,
  type ConsentDecisionFilter,
} from "./validation";

export interface ConsentRecord {
  id: string;
  anonymous_session_id: string;
  consent_version: string;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  user_agent_category: UserAgentCategory | null;
  created_at: string;
  updated_at: string;
}

export interface GetConsentRecordsParams {
  search?: string;
  decision?: string;
  device?: string;
  version?: string;
  page?: number | string;
  pageSize?: number | string;
  sortBy?: "newest" | "oldest" | string;
}

export interface ConsentRecordsListResult {
  records: ConsentRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

export interface ConsentDecisionCounts {
  all: number;
  full: number;
  essential_only: number;
  analytics: number;
  marketing: number;
  error: string | null;
}

/**
 * Retrieves paginated, filtered cookie consent audit records using the authenticated Supabase client.
 * Enforces row-level security and bounded queries.
 * Never requests service-role bypass.
 */
export async function getConsentRecordsList(
  supabase: SupabaseClient<Database>,
  params: GetConsentRecordsParams = {}
): Promise<ConsentRecordsListResult> {
  const pagination = calculatePagination({
    page: params.page,
    pageSize: params.pageSize,
    defaultPageSize: 10,
    maxPageSize: 50,
  });

  try {
    let query = supabase
      .from("cookie_consents")
      .select(
        "id, anonymous_session_id, consent_version, essential, analytics, marketing, user_agent_category, created_at, updated_at",
        { count: "exact" }
      );

    // 1. Consent Decision Filter
    if (params.decision && isValidConsentDecision(params.decision)) {
      const decision = params.decision.toLowerCase() as ConsentDecisionFilter;
      switch (decision) {
        case "full":
          query = query.eq("analytics", true).eq("marketing", true);
          break;
        case "essential_only":
          query = query.eq("analytics", false).eq("marketing", false);
          break;
        case "analytics":
          query = query.eq("analytics", true);
          break;
        case "marketing":
          query = query.eq("marketing", true);
          break;
        case "all":
        default:
          break;
      }
    }

    // 2. Device / User Agent Category Filter
    if (
      params.device &&
      params.device !== "all" &&
      isValidUserAgentCategory(params.device)
    ) {
      query = query.eq("user_agent_category", params.device.toLowerCase() as UserAgentCategory);
    }

    // 3. Policy Version Filter
    if (params.version && params.version !== "all") {
      const sanitizedVersion = params.version.trim().slice(0, 20);
      if (sanitizedVersion) {
        query = query.eq("consent_version", sanitizedVersion);
      }
    }

    // 4. Search Filter (searches anonymous_session_id and id if UUID)
    const sanitizedSearch = sanitizeSearchQuery(params.search);
    if (sanitizedSearch) {
      if (isValidUUID(sanitizedSearch)) {
        query = query.or(
          `id.eq.${sanitizedSearch},anonymous_session_id.ilike.%${sanitizedSearch}%`
        );
      } else {
        query = query.ilike("anonymous_session_id", `%${sanitizedSearch}%`);
      }
    }

    // 5. Sorting
    if (params.sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // 6. Bounded Pagination
    query = query.range(pagination.from, pagination.to);

    const { data, count, error } = await query;

    if (error) {
      return {
        records: [],
        totalCount: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 1,
        error: error.message || "Failed to load consent audit records.",
      };
    }

    const totalCount = count ?? 0;
    const totalPages = pagination.calculateTotalPages(totalCount);

    return {
      records: (data as ConsentRecord[]) || [],
      totalCount,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    return {
      records: [],
      totalCount: 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: 1,
      error: err instanceof Error ? err.message : "An unexpected query error occurred.",
    };
  }
}

/**
 * Loads decision category counts in parallel for consent audit tabs.
 */
export async function getConsentDecisionCounts(
  supabase: SupabaseClient<Database>
): Promise<ConsentDecisionCounts> {
  try {
    const [allRes, fullRes, essentialOnlyRes, analyticsRes, marketingRes] =
      await Promise.all([
        supabase.from("cookie_consents").select("*", { count: "exact", head: true }),
        supabase
          .from("cookie_consents")
          .select("*", { count: "exact", head: true })
          .eq("analytics", true)
          .eq("marketing", true),
        supabase
          .from("cookie_consents")
          .select("*", { count: "exact", head: true })
          .eq("analytics", false)
          .eq("marketing", false),
        supabase
          .from("cookie_consents")
          .select("*", { count: "exact", head: true })
          .eq("analytics", true),
        supabase
          .from("cookie_consents")
          .select("*", { count: "exact", head: true })
          .eq("marketing", true),
      ]);

    const error =
      allRes.error?.message ||
      fullRes.error?.message ||
      essentialOnlyRes.error?.message ||
      analyticsRes.error?.message ||
      marketingRes.error?.message ||
      null;

    return {
      all: allRes.count ?? 0,
      full: fullRes.count ?? 0,
      essential_only: essentialOnlyRes.count ?? 0,
      analytics: analyticsRes.count ?? 0,
      marketing: marketingRes.count ?? 0,
      error,
    };
  } catch (err) {
    return {
      all: 0,
      full: 0,
      essential_only: 0,
      analytics: 0,
      marketing: 0,
      error: err instanceof Error ? err.message : "Failed to load decision counts.",
    };
  }
}
