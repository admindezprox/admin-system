import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, BookingStatus } from "@/lib/supabase/types";
import { isValidBookingStatus, isValidUUID, sanitizeSearchQuery } from "./validation";

export interface BookingWithFounder {
  id: string;
  email: string;
  phone: string;
  requested_date: string;
  requested_time_slot: string;
  notes: string | null;
  status: BookingStatus;
  internal_notes: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  confirmed_by_founder?: {
    full_name: string;
    email: string;
  } | null;
}

export interface GetBookingsParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "newest" | "oldest" | "requested_date_asc" | "requested_date_desc";
}

export interface BookingsListResult {
  bookings: BookingWithFounder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: string | null;
}

export interface BookingStatusCounts {
  all: number;
  pending: number;
  confirmed: number;
  rescheduled: number;
  cancelled: number;
  completed: number;
  error: string | null;
}

/**
 * Retrieves paginated, filtered booking requests using the authenticated Supabase client.
 * Enforces row-level security and bounded queries.
 */
export async function getBookingsList(
  supabase: SupabaseClient<Database>,
  params: GetBookingsParams = {}
): Promise<BookingsListResult> {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(params.pageSize) || 10)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("booking_requests")
      .select(
        `
        id,
        email,
        phone,
        requested_date,
        requested_time_slot,
        notes,
        status,
        internal_notes,
        confirmed_by,
        confirmed_at,
        created_at,
        updated_at,
        confirmed_by_founder:founder_profiles!booking_requests_confirmed_by_fkey(full_name, email)
      `,
        { count: "exact" }
      );

    // 1. Status Filter
    if (params.status && params.status !== "all" && isValidBookingStatus(params.status)) {
      query = query.eq("status", params.status);
    }

    // 2. Search Filter (searches email and phone safely)
    const sanitizedSearch = sanitizeSearchQuery(params.search);
    if (sanitizedSearch) {
      query = query.or(`email.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%`);
    }

    // 3. Sorting
    switch (params.sortBy) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "requested_date_asc":
        query = query.order("requested_date", { ascending: true });
        break;
      case "requested_date_desc":
        query = query.order("requested_date", { ascending: false });
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
        bookings: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
        error: error.message ?? "Failed to retrieve booking requests.",
      };
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      bookings: (data as unknown as BookingWithFounder[]) ?? [],
      totalCount,
      page,
      pageSize,
      totalPages,
      error: null,
    };
  } catch (err) {
    return {
      bookings: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1,
      error: err instanceof Error ? err.message : "Unexpected database error.",
    };
  }
}

/**
 * Retrieves a single booking request by ID with founder confirmation details.
 */
export async function getBookingById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<{ booking: BookingWithFounder | null; error: string | null }> {
  if (!isValidUUID(id)) {
    return { booking: null, error: "Invalid booking ID format." };
  }

  try {
    const { data, error } = await supabase
      .from("booking_requests")
      .select(
        `
        id,
        email,
        phone,
        requested_date,
        requested_time_slot,
        notes,
        status,
        internal_notes,
        confirmed_by,
        confirmed_at,
        created_at,
        updated_at,
        confirmed_by_founder:founder_profiles!booking_requests_confirmed_by_fkey(full_name, email)
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { booking: null, error: error.message ?? "Failed to fetch booking details." };
    }

    return { booking: (data as unknown as BookingWithFounder) ?? null, error: null };
  } catch (err) {
    return {
      booking: null,
      error: err instanceof Error ? err.message : "Unexpected database error.",
    };
  }
}

/**
 * Retrieves counts for each booking status to power filter tabs.
 */
export async function getBookingStatusCounts(
  supabase: SupabaseClient<Database>
): Promise<BookingStatusCounts> {
  try {
    const [allRes, pendingRes, confirmedRes, rescheduledRes, cancelledRes, completedRes] =
      await Promise.all([
        supabase.from("booking_requests").select("*", { count: "exact", head: true }),
        supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "rescheduled"),
        supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
        supabase.from("booking_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
      ]);

    const hasError =
      allRes.error ||
      pendingRes.error ||
      confirmedRes.error ||
      rescheduledRes.error ||
      cancelledRes.error ||
      completedRes.error;

    return {
      all: allRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      confirmed: confirmedRes.count ?? 0,
      rescheduled: rescheduledRes.count ?? 0,
      cancelled: cancelledRes.count ?? 0,
      completed: completedRes.count ?? 0,
      error: hasError ? "Some status counts could not be queried." : null,
    };
  } catch {
    return {
      all: 0,
      pending: 0,
      confirmed: 0,
      rescheduled: 0,
      cancelled: 0,
      completed: 0,
      error: "Failed to query booking counts.",
    };
  }
}
