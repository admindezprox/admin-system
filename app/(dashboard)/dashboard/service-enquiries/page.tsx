import type { Metadata } from "next";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { getServiceEnquiriesList, getServiceEnquiryStatusCounts } from "@/lib/service-enquiries/queries";
import { ServiceEnquiriesView } from "./service-enquiries-view";

export const metadata: Metadata = {
  title: "Service & Project Enquiries — Dezprox Founder Admin",
  description: "Manage client project briefs, service requests, budget tiers, and pipeline statuses",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface ServiceEnquiriesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    page?: string;
    sortBy?: "newest" | "oldest";
    id?: string;
  }>;
}

export default async function ServiceEnquiriesPage({ searchParams }: ServiceEnquiriesPageProps) {
  // 1. Authoritative founder verification
  const { supabase, founder } = await requireActiveFounder("/dashboard/service-enquiries");

  // 2. Resolve query parameters
  const resolvedParams = await searchParams;
  const currentSearch = resolvedParams.q || "";
  const currentStatus = resolvedParams.status || "all";
  const currentCategory = resolvedParams.category || "all";
  const currentSort = resolvedParams.sortBy || "newest";
  const currentPage = Math.max(1, Math.floor(Number(resolvedParams.page) || 1));
  const selectedId = resolvedParams.id;

  // 3. Fetch real service enquiries list and status category counts in parallel
  const [listResult, statusCounts] = await Promise.all([
    getServiceEnquiriesList(supabase, {
      search: currentSearch,
      status: currentStatus,
      category: currentCategory,
      page: currentPage,
      sortBy: currentSort,
      pageSize: 10,
    }),
    getServiceEnquiryStatusCounts(supabase),
  ]);

  return (
    <ServiceEnquiriesView
      enquiries={listResult.enquiries}
      totalCount={listResult.totalCount}
      page={listResult.page}
      pageSize={listResult.pageSize}
      totalPages={listResult.totalPages}
      statusCounts={statusCounts}
      currentSearch={currentSearch}
      currentStatus={currentStatus}
      currentCategory={currentCategory}
      currentSort={currentSort}
      initialSelectedId={selectedId}
      queryError={listResult.error}
      activeFounderName={founder.fullName}
      activeFounderId={founder.id}
    />
  );
}
