import type { Metadata } from "next";
import { requireActiveFounder } from "@/lib/supabase/founder";
import {
  getConsentRecordsList,
  getConsentDecisionCounts,
} from "@/lib/consent-tracking/queries";
import { ConsentTrackingView } from "./consent-tracking-view";

export const metadata: Metadata = {
  title: "Consent Tracking — Dezprox Founder Admin",
  description:
    "Audit privacy-compliant cookie preferences, consent versioning, and client environment logs",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

interface ConsentTrackingPageProps {
  searchParams: Promise<{
    q?: string;
    decision?: string;
    device?: string;
    version?: string;
    page?: string;
    sortBy?: "newest" | "oldest";
    id?: string;
  }>;
}

export default async function ConsentTrackingPage({
  searchParams,
}: ConsentTrackingPageProps) {
  // 1. Authoritative founder verification
  const { supabase } = await requireActiveFounder("/dashboard/consent-tracking");

  // 2. Resolve query parameters
  const resolvedParams = await searchParams;
  const currentSearch = resolvedParams.q || "";
  const currentDecision = resolvedParams.decision || "all";
  const currentDevice = resolvedParams.device || "all";
  const currentVersion = resolvedParams.version || "all";
  const currentSort = resolvedParams.sortBy || "newest";
  const currentPage = Math.max(1, Math.floor(Number(resolvedParams.page) || 1));
  const selectedId = resolvedParams.id;

  // 3. Fetch real consent logs and decision counts in parallel
  const [listResult, decisionCounts] = await Promise.all([
    getConsentRecordsList(supabase, {
      search: currentSearch,
      decision: currentDecision,
      device: currentDevice,
      version: currentVersion,
      page: currentPage,
      sortBy: currentSort,
      pageSize: 10,
    }),
    getConsentDecisionCounts(supabase),
  ]);

  return (
    <ConsentTrackingView
      records={listResult.records}
      totalCount={listResult.totalCount}
      page={listResult.page}
      pageSize={listResult.pageSize}
      totalPages={listResult.totalPages}
      decisionCounts={decisionCounts}
      currentSearch={currentSearch}
      currentDecision={currentDecision}
      currentDevice={currentDevice}
      currentVersion={currentVersion}
      currentSort={currentSort}
      initialSelectedId={selectedId}
      queryError={listResult.error || decisionCounts.error}
    />
  );
}
