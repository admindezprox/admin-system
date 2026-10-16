import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, BookingStatus, ContactEnquiryStatus, ServiceCategory, ServiceEnquiryStatus, BudgetTier, UserAgentCategory } from "@/lib/supabase/types";

export interface MetricResult {
  count: number | null;
  error: string | null;
}

export interface RecentBookingRow {
  id: string;
  email: string;
  phone: string;
  requested_date: string;
  requested_time_slot: string;
  status: BookingStatus;
  created_at: string;
}

export interface RecentContactRow {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
  status: ContactEnquiryStatus;
  created_at: string;
}

export interface RecentServiceRow {
  id: string;
  full_name: string;
  email: string;
  service_category: ServiceCategory;
  budget_tier: BudgetTier | null;
  status: ServiceEnquiryStatus;
  created_at: string;
}

export interface RecentConsentRow {
  id: string;
  anonymous_session_id: string;
  consent_version: string;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  user_agent_category: UserAgentCategory | null;
  created_at: string;
}

export interface DashboardSummaryData {
  metrics: {
    totalBookings: MetricResult;
    pendingBookings: MetricResult;
    totalContactEnquiries: MetricResult;
    newContactEnquiries: MetricResult;
    totalServiceEnquiries: MetricResult;
    newServiceEnquiries: MetricResult;
    totalCookieConsents: MetricResult;
  };
  recentBookings: { data: RecentBookingRow[]; error: string | null };
  recentContacts: { data: RecentContactRow[]; error: string | null };
  recentServices: { data: RecentServiceRow[]; error: string | null };
  recentConsents: { data: RecentConsentRow[]; error: string | null };
  hasQueryErrors: boolean;
  loadedAt: string;
}

function parseCountResult(res: { count: number | null; error: { message?: string } | null }): MetricResult {
  if (res.error) {
    return { count: null, error: res.error.message ?? "Database query error" };
  }
  return { count: res.count ?? 0, error: null };
}

function parseListResult<T>(res: { data: T[] | null; error: { message?: string } | null }): {
  data: T[];
  error: string | null;
} {
  if (res.error) {
    return { data: [], error: res.error.message ?? "Database query error" };
  }
  return { data: res.data ?? [], error: null };
}

/**
 * Loads real-time founder dashboard metrics and recent submissions from Supabase.
 * Executes queries in parallel using the authenticated user's session and RLS policies.
 * Never requests service-role bypass.
 */
export async function getDashboardData(
  supabase: SupabaseClient<Database>
): Promise<DashboardSummaryData> {
  const [
    totalBookingsRes,
    pendingBookingsRes,
    totalContactsRes,
    newContactsRes,
    totalServicesRes,
    newServicesRes,
    totalConsentsRes,
    recentBookingsRes,
    recentContactsRes,
    recentServicesRes,
    recentConsentsRes,
  ] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("contact_enquiries")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("contact_enquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("service_enquiries")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("service_enquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("cookie_consents")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("booking_requests")
      .select("id, email, phone, requested_date, requested_time_slot, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("contact_enquiries")
      .select("id, full_name, email, subject, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("service_enquiries")
      .select("id, full_name, email, service_category, budget_tier, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("cookie_consents")
      .select("id, anonymous_session_id, consent_version, essential, analytics, marketing, user_agent_category, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const totalBookings = parseCountResult(totalBookingsRes);
  const pendingBookings = parseCountResult(pendingBookingsRes);
  const totalContactEnquiries = parseCountResult(totalContactsRes);
  const newContactEnquiries = parseCountResult(newContactsRes);
  const totalServiceEnquiries = parseCountResult(totalServicesRes);
  const newServiceEnquiries = parseCountResult(newServicesRes);
  const totalCookieConsents = parseCountResult(totalConsentsRes);

  const recentBookings = parseListResult<RecentBookingRow>(recentBookingsRes);
  const recentContacts = parseListResult<RecentContactRow>(recentContactsRes);
  const recentServices = parseListResult<RecentServiceRow>(recentServicesRes);
  const recentConsents = parseListResult<RecentConsentRow>(recentConsentsRes);

  const hasQueryErrors =
    totalBookings.error !== null ||
    pendingBookings.error !== null ||
    totalContactEnquiries.error !== null ||
    newContactEnquiries.error !== null ||
    totalServiceEnquiries.error !== null ||
    newServiceEnquiries.error !== null ||
    totalCookieConsents.error !== null ||
    recentBookings.error !== null ||
    recentContacts.error !== null ||
    recentServices.error !== null ||
    recentConsents.error !== null;

  return {
    metrics: {
      totalBookings,
      pendingBookings,
      totalContactEnquiries,
      newContactEnquiries,
      totalServiceEnquiries,
      newServiceEnquiries,
      totalCookieConsents,
    },
    recentBookings,
    recentContacts,
    recentServices,
    recentConsents,
    hasQueryErrors,
    loadedAt: new Date().toISOString(),
  };
}
