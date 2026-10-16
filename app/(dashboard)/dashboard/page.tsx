import type { Metadata } from "next";
import { CheckCircle2, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { getDashboardData } from "@/lib/dashboard/queries";
import { SummaryCards } from "./summary-cards";
import { RecentActivity } from "./recent-activity";
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
  // 1. Authoritative server-side authorization check
  const { founder, supabase } = await requireActiveFounder();

  // 2. Fetch real data from all four Supabase tables in parallel under founder session
  const dashboardData = await getDashboardData(supabase);

  return (
    <div className="space-y-8">
      {/* Welcome & System Status Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-radial from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Supabase Connected · Row Level Security Enforced</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {founder.fullName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Founder session verified for <span className="text-zinc-200 font-mono">{founder.email}</span>
            </p>
          </div>

          {/* Authorization & Timestamp Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <Shield className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <div>
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Authorization
                </div>
                <div className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
                  {founder.role.replace("_", " ")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <RefreshCw className="h-4 w-4 text-zinc-400" aria-hidden="true" />
              <div>
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Data Synced
                </div>
                <div className="text-xs text-zinc-200 font-mono">
                  {formatDateTime(dashboardData.loadedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Error Alert (If Any Table Query Encountered an Issue) */}
      {dashboardData.hasQueryErrors && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-amber-200"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-amber-300">
              One or more database tables could not be queried
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Some metrics or recent records could not be loaded from Supabase. Ensure row-level security policies grant SELECT permissions to authenticated founders for all tables.
            </p>
          </div>
        </div>
      )}

      {/* Real Supabase Summary Cards */}
      <section aria-labelledby="summary-overview-heading">
        <h2 id="summary-overview-heading" className="sr-only">
          Metrics Overview
        </h2>
        <SummaryCards metrics={dashboardData.metrics} />
      </section>

      {/* Real Supabase Recent Activity & Submissions */}
      <section aria-labelledby="recent-activity-heading">
        <h2 id="recent-activity-heading" className="sr-only">
          Recent Website Submissions
        </h2>
        <RecentActivity
          recentBookings={dashboardData.recentBookings}
          recentContacts={dashboardData.recentContacts}
          recentServices={dashboardData.recentServices}
          recentConsents={dashboardData.recentConsents}
        />
      </section>

      {/* Phase 6 Operational Status Notice */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-400">Phase 6 Operational Status:</span> Booking Requests, Contact Enquiries, and Service & Project Enquiries management modules are live. Consent tracking is scheduled for Phase 7.
      </div>
    </div>
  );
}
