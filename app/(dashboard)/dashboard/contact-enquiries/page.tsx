import type { Metadata } from "next";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { getContactEnquiriesList, getContactEnquiryStatusCounts } from "@/lib/contact-enquiries/queries";
import { ContactEnquiriesView } from "./contact-enquiries-view";

export const metadata: Metadata = {
  title: "Contact Enquiries — Dezprox Founder Admin",
  description: "Manage website contact form enquiries, correspondence, and client messages",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface ContactEnquiriesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    sortBy?: "newest" | "oldest";
    id?: string;
  }>;
}

export default async function ContactEnquiriesPage({ searchParams }: ContactEnquiriesPageProps) {
  // 1. Authoritative founder verification
  const { supabase } = await requireActiveFounder("/dashboard/contact-enquiries");

  // 2. Resolve query parameters
  const resolvedParams = await searchParams;
  const currentSearch = resolvedParams.q || "";
  const currentStatus = resolvedParams.status || "all";
  const currentSort = resolvedParams.sortBy || "newest";
  const currentPage = Math.max(1, Math.floor(Number(resolvedParams.page) || 1));
  const selectedId = resolvedParams.id;

  // 3. Fetch real contact enquiries list and status counts in parallel
  const [listResult, statusCounts] = await Promise.all([
    getContactEnquiriesList(supabase, {
      search: currentSearch,
      status: currentStatus,
      page: currentPage,
      sortBy: currentSort,
      pageSize: 10,
    }),
    getContactEnquiryStatusCounts(supabase),
  ]);

  return (
    <ContactEnquiriesView
      enquiries={listResult.enquiries}
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
