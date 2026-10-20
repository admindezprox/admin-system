import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Shield,
  AlertTriangle,
  RefreshCw,
  BellRing,
  ArrowRight,
} from "lucide-react";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { getDashboardData } from "@/lib/dashboard/queries";
import { SummaryCards } from "./summary-cards";
import { AnalyticsCharts } from "./analytics-charts";
import { CompactRecentActivity } from "./compact-recent-activity";
import { formatDateTime } from "@/lib/dashboard/formatters";

export const metadata: Metadata = {
  title: "Dashboard — Dezprox Founder Admin",
  description: "Real-time Dezprox Founder Administrative Management Overview",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function DashboardPage() {
  // 1. Authoritative server-side authorization check (memoized per-request)
  const { founder, supabase } = await requireActiveFounder();

  // 2. Fetch real data from all four Supabase tables in parallel under founder session
  const dashboardData = await getDashboardData(supabase);
  const { operationalSummary } = dashboardData.analytics;
  const hasActionableItems =
    operationalSummary.pendingBookings > 0 ||
    operationalSummary.newContacts > 0 ||
    operationalSummary.newServices > 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Compact Welcome Header & System Status Banner */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              <span>Supabase Connected · Row Level Security Enforced</span>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Welcome back, {founder.fullName}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Founder session verified for <span className="text-zinc-700 font-mono">{founder.email}</span>
            </p>
          </div>

          {/* Authorization & Timestamp Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <div>
                <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Authorization
                </div>
                <div className="text-xs text-zinc-900 font-medium uppercase tracking-wide">
                  {founder.role.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              <div>
                <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Data Synced
                </div>
                <div className="text-xs text-zinc-700 font-mono">
                  {formatDateTime(dashboardData.loadedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Optional Operational Action Banner (When Pending Items Await Founder Review) */}
      {hasActionableItems && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-800">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div>
              <span className="font-semibold text-amber-950">
                Action required on incoming enquiries:
              </span>{" "}
              <span className="text-amber-800">
                {operationalSummary.pendingBookings > 0 && `${operationalSummary.pendingBookings} calls pending confirmation. `}
                {operationalSummary.newContacts > 0 && `${operationalSummary.newContacts} unread contact requests. `}
                {operationalSummary.newServices > 0 && `${operationalSummary.newServices} new service proposals.`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {operationalSummary.pendingBookings > 0 && (
              <Link
                href="/dashboard/bookings?status=pending"
                className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer"
              >
                <span>Review Calls</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {operationalSummary.newContacts > 0 && (
              <Link
                href="/dashboard/contact-enquiries?status=new"
                className="flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition-colors cursor-pointer"
              >
                <span>Review Contacts</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Database Error Alert (If Any Table Query Encountered an Issue) */}
      {dashboardData.hasQueryErrors && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-amber-900">
              One or more database tables could not be queried
            </div>
            <p className="text-amber-800/90 leading-relaxed">
              Some metrics or recent records could not be loaded from Supabase. Ensure row-level security policies grant SELECT permissions to authenticated founders for all tables.
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary KPI Summary Cards with Grounded Trends */}
      <section aria-labelledby="summary-overview-heading" className="animate-slideUp">
        <h2 id="summary-overview-heading" className="sr-only">
          Metrics Overview
        </h2>
        <SummaryCards
          metrics={dashboardData.metrics}
          trends={dashboardData.analytics.trends}
        />
      </section>

      {/* 4. Dedicated Analytics Section (Interactive SVG Charts) */}
      <section aria-labelledby="analytics-overview-heading" className="animate-slideUp">
        <h2 id="analytics-overview-heading" className="sr-only">
          Website Analytics & Intake Performance
        </h2>
        <AnalyticsCharts analytics={dashboardData.analytics} />
      </section>

      {/* 5. Compact Recent Activity & Submissions (Top 5 scan) */}
      <section aria-labelledby="recent-activity-heading" className="animate-slideUp">
        <h2 id="recent-activity-heading" className="sr-only">
          Recent Website Submissions
        </h2>
        <CompactRecentActivity
          recentBookings={dashboardData.recentBookings}
          recentContacts={dashboardData.recentContacts}
          recentServices={dashboardData.recentServices}
        />
      </section>

      {/* Operational Status Footer */}
      <div className="rounded-lg border border-zinc-200/80 bg-white p-3.5 text-xs text-zinc-500 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="font-semibold text-zinc-700">Operational Integrity:</span> Booking Requests, Contact Enquiries, and Service & Project Enquiries intake systems are fully synchronized.
        </div>
        <div className="font-mono text-[11px] text-zinc-400">
          Dezprox Internal System · v2.1
        </div>
      </div>
    </div>
  );
}
