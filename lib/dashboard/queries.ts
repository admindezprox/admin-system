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

export interface DailyEnquiryPoint {
  date: string;
  label: string;
  bookings: number;
  contacts: number;
  services: number;
  total: number;
}

export interface TrendInfo {
  label: string;
  isPositive: boolean;
  hasData: boolean;
}

export interface StatusCountItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
  badgeClass: string;
  dotClass: string;
}

export interface AnalyticsData {
  dailyLast7Days: DailyEnquiryPoint[];
  dailyLast30Days: DailyEnquiryPoint[];
  enquiryDistribution: {
    bookings: number;
    contacts: number;
    services: number;
    total: number;
    bookingPct: number;
    contactPct: number;
    servicePct: number;
  };
  statusBreakdown: {
    bookings: StatusCountItem[];
    contacts: StatusCountItem[];
    services: StatusCountItem[];
  };
  trends: {
    bookings: TrendInfo;
    contacts: TrendInfo;
    services: TrendInfo;
    consents: TrendInfo;
  };
  operationalSummary: {
    pendingBookings: number;
    newContacts: number;
    newServices: number;
  };
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
  analytics: AnalyticsData;
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

function buildDailyPoints(
  daysCount: number,
  bookings: { created_at: string }[],
  contacts: { created_at: string }[],
  services: { created_at: string }[]
): DailyEnquiryPoint[] {
  const points: DailyEnquiryPoint[] = [];
  const now = new Date();

  const bookingMap = new Map<string, number>();
  for (const b of bookings) {
    const key = b.created_at.slice(0, 10);
    bookingMap.set(key, (bookingMap.get(key) || 0) + 1);
  }

  const contactMap = new Map<string, number>();
  for (const c of contacts) {
    const key = c.created_at.slice(0, 10);
    contactMap.set(key, (contactMap.get(key) || 0) + 1);
  }

  const serviceMap = new Map<string, number>();
  for (const s of services) {
    const key = s.created_at.slice(0, 10);
    serviceMap.set(key, (serviceMap.get(key) || 0) + 1);
  }

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const day = d.getDate();
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const label = daysCount <= 7 ? `${weekday} ${day}` : `${month} ${day}`;

    const bCount = bookingMap.get(dateStr) || 0;
    const cCount = contactMap.get(dateStr) || 0;
    const sCount = serviceMap.get(dateStr) || 0;

    points.push({
      date: dateStr,
      label,
      bookings: bCount,
      contacts: cCount,
      services: sCount,
      total: bCount + cCount + sCount,
    });
  }

  return points;
}

function calculateTrend(
  records: { created_at: string }[]
): TrendInfo {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  let currentPeriod = 0;
  let previousPeriod = 0;

  for (const r of records) {
    const t = new Date(r.created_at).getTime();
    if (t >= sevenDaysAgo) {
      currentPeriod++;
    } else if (t >= fourteenDaysAgo) {
      previousPeriod++;
    }
  }

  if (currentPeriod === 0 && previousPeriod === 0) {
    return { label: "No recent activity", isPositive: false, hasData: false };
  }

  if (previousPeriod === 0) {
    return { label: `+${currentPeriod} this week`, isPositive: true, hasData: true };
  }

  const diff = currentPeriod - previousPeriod;
  const pct = Math.round((diff / previousPeriod) * 100);
  const sign = pct >= 0 ? "+" : "";
  return {
    label: `${sign}${pct}% vs last wk`,
    isPositive: pct >= 0,
    hasData: true,
  };
}

/**
 * Loads real-time founder dashboard metrics, analytics, and recent submissions from Supabase.
 * Executes queries in parallel using the authenticated user's session and RLS policies.
 * Never requests service-role bypass.
 */
export async function getDashboardData(
  supabase: SupabaseClient<Database>
): Promise<DashboardSummaryData> {
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

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
    thirtyDaysBookingsRes,
    thirtyDaysContactsRes,
    thirtyDaysServicesRes,
    thirtyDaysConsentsRes,
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
    supabase
      .from("booking_requests")
      .select("id, status, created_at")
      .gte("created_at", thirtyDaysAgoIso),
    supabase
      .from("contact_enquiries")
      .select("id, status, created_at")
      .gte("created_at", thirtyDaysAgoIso),
    supabase
      .from("service_enquiries")
      .select("id, status, created_at")
      .gte("created_at", thirtyDaysAgoIso),
    supabase
      .from("cookie_consents")
      .select("id, created_at")
      .gte("created_at", thirtyDaysAgoIso),
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

  const thirtyDaysBookings = parseListResult<{ id: string; status: BookingStatus; created_at: string }>(thirtyDaysBookingsRes).data;
  const thirtyDaysContacts = parseListResult<{ id: string; status: ContactEnquiryStatus; created_at: string }>(thirtyDaysContactsRes).data;
  const thirtyDaysServices = parseListResult<{ id: string; status: ServiceEnquiryStatus; created_at: string }>(thirtyDaysServicesRes).data;
  const thirtyDaysConsents = parseListResult<{ id: string; created_at: string }>(thirtyDaysConsentsRes).data;

  // Build daily timeline arrays for 7-day and 30-day views
  const dailyLast7Days = buildDailyPoints(7, thirtyDaysBookings, thirtyDaysContacts, thirtyDaysServices);
  const dailyLast30Days = buildDailyPoints(30, thirtyDaysBookings, thirtyDaysContacts, thirtyDaysServices);

  // Compute enquiry distribution percentages
  const totalEnquiriesCount = (totalBookings.count ?? 0) + (totalContactEnquiries.count ?? 0) + (totalServiceEnquiries.count ?? 0);
  const bookingPct = totalEnquiriesCount > 0 ? Math.round(((totalBookings.count ?? 0) / totalEnquiriesCount) * 100) : 0;
  const contactPct = totalEnquiriesCount > 0 ? Math.round(((totalContactEnquiries.count ?? 0) / totalEnquiriesCount) * 100) : 0;
  const servicePct = totalEnquiriesCount > 0 ? Math.max(0, 100 - bookingPct - contactPct) : 0;

  // Compute status distributions from actual 30-day records
  const countStatuses = <T extends string>(items: { status: T }[]): Map<T, number> => {
    const map = new Map<T, number>();
    for (const it of items) {
      map.set(it.status, (map.get(it.status) || 0) + 1);
    }
    return map;
  };

  const bMap = countStatuses(thirtyDaysBookings);
  const cMap = countStatuses(thirtyDaysContacts);
  const sMap = countStatuses(thirtyDaysServices);

  const formatStatusItems = (map: Map<string, number>, total: number, labels: Record<string, { label: string; badge: string; dot: string }>): StatusCountItem[] => {
    return Array.from(map.entries()).map(([st, cnt]) => {
      const cfg = labels[st] || { label: st, badge: "border-zinc-200 bg-zinc-50 text-zinc-700", dot: "bg-zinc-400" };
      return {
        status: st,
        label: cfg.label,
        count: cnt,
        percentage: total > 0 ? Math.round((cnt / total) * 100) : 0,
        badgeClass: cfg.badge,
        dotClass: cfg.dot,
      };
    }).sort((a, b) => b.count - a.count);
  };

  const bookingStatusItems = formatStatusItems(bMap as Map<string, number>, thirtyDaysBookings.length, {
    pending: { label: "Pending", badge: "border-amber-200 bg-amber-50 text-amber-800", dot: "bg-amber-500" },
    confirmed: { label: "Confirmed", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-600" },
    rescheduled: { label: "Rescheduled", badge: "border-yellow-200 bg-yellow-50 text-yellow-800", dot: "bg-yellow-600" },
    cancelled: { label: "Cancelled", badge: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
    completed: { label: "Completed", badge: "border-cyan-200 bg-cyan-50 text-cyan-800", dot: "bg-cyan-600" },
  });

  const contactStatusItems = formatStatusItems(cMap as Map<string, number>, thirtyDaysContacts.length, {
    new: { label: "New", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-600" },
    in_review: { label: "In Review", badge: "border-blue-200 bg-blue-50 text-blue-800", dot: "bg-blue-600" },
    responded: { label: "Responded", badge: "border-zinc-200 bg-zinc-100 text-zinc-700", dot: "bg-zinc-500" },
    archived: { label: "Archived", badge: "border-zinc-200 bg-zinc-50 text-zinc-600", dot: "bg-zinc-400" },
    spam: { label: "Spam", badge: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  });

  const serviceStatusItems = formatStatusItems(sMap as Map<string, number>, thirtyDaysServices.length, {
    new: { label: "New", badge: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-600" },
    contacted: { label: "Contacted", badge: "border-blue-200 bg-blue-50 text-blue-800", dot: "bg-blue-600" },
    discovery_scheduled: { label: "Discovery", badge: "border-cyan-200 bg-cyan-50 text-cyan-800", dot: "bg-cyan-600" },
    proposal_sent: { label: "Proposal", badge: "border-purple-200 bg-purple-50 text-purple-800", dot: "bg-purple-600" },
    closed_won: { label: "Closed Won", badge: "border-emerald-300 bg-emerald-100 text-emerald-900", dot: "bg-emerald-600" },
    closed_lost: { label: "Closed Lost", badge: "border-red-200 bg-red-50 text-red-800", dot: "bg-red-500" },
  });

  // Calculate trends grounded in real data
  const bookingsTrend = calculateTrend(thirtyDaysBookings);
  const contactsTrend = calculateTrend(thirtyDaysContacts);
  const servicesTrend = calculateTrend(thirtyDaysServices);
  const consentsTrend = calculateTrend(thirtyDaysConsents);

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
    analytics: {
      dailyLast7Days,
      dailyLast30Days,
      enquiryDistribution: {
        bookings: totalBookings.count ?? 0,
        contacts: totalContactEnquiries.count ?? 0,
        services: totalServiceEnquiries.count ?? 0,
        total: totalEnquiriesCount,
        bookingPct,
        contactPct,
        servicePct,
      },
      statusBreakdown: {
        bookings: bookingStatusItems,
        contacts: contactStatusItems,
        services: serviceStatusItems,
      },
      trends: {
        bookings: bookingsTrend,
        contacts: contactsTrend,
        services: servicesTrend,
        consents: consentsTrend,
      },
      operationalSummary: {
        pendingBookings: pendingBookings.count ?? 0,
        newContacts: newContactEnquiries.count ?? 0,
        newServices: newServiceEnquiries.count ?? 0,
      },
    },
    hasQueryErrors,
    loadedAt: new Date().toISOString(),
  };
}
