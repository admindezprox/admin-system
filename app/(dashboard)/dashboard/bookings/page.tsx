import type { Metadata } from "next";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { getBookingsList, getBookingStatusCounts } from "@/lib/bookings/queries";
import { BookingsView } from "./bookings-view";

export const metadata: Metadata = {
  title: "Booking Requests — Dezprox Founder Admin",
  description: "Manage consultation call booking requests and schedules",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface BookingsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sortBy?: "newest" | "oldest" | "requested_date_asc" | "requested_date_desc";
    id?: string;
  }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  // 1. Authoritative founder verification
  const { supabase } = await requireActiveFounder("/dashboard/bookings");

  // 2. Resolve query parameters
  const resolvedParams = await searchParams;
  const currentSearch = resolvedParams.q || "";
  const currentStatus = resolvedParams.status || "all";
  const currentSort = resolvedParams.sortBy || "newest";
  const currentPage = Math.max(1, Math.floor(Number(resolvedParams.page) || 1));
  const selectedId = resolvedParams.id;

  // 3. Fetch real bookings list and status category counts in parallel
  const [listResult, statusCounts] = await Promise.all([
    getBookingsList(supabase, {
      search: currentSearch,
      status: currentStatus,
      page: currentPage,
      sortBy: currentSort,
      pageSize: 10,
    }),
    getBookingStatusCounts(supabase),
  ]);

  return (
    <BookingsView
      bookings={listResult.bookings}
      totalCount={listResult.totalCount}
      page={listResult.page}
      pageSize={listResult.pageSize}
      totalPages={listResult.totalPages}
      statusCounts={statusCounts}
      currentSearch={currentSearch}
      currentStatus={currentStatus}
      currentSort={currentSort}
      initialSelectedId={selectedId}
      queryError={listResult.error}
    />
  );
}
