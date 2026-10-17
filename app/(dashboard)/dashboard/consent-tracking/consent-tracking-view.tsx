"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cookie,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  Copy,
  Check,
  Laptop,
  Smartphone,
  Tablet,
  Bot,
  HelpCircle,
  Calendar,
  Lock,
} from "lucide-react";
import type {
  ConsentRecord,
  ConsentDecisionCounts,
} from "@/lib/consent-tracking/queries";
import type { UserAgentCategory } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/dashboard/formatters";
import { VALID_USER_AGENT_CATEGORIES } from "@/lib/consent-tracking/validation";

interface ConsentTrackingViewProps {
  records: ConsentRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  decisionCounts: ConsentDecisionCounts;
  currentSearch?: string;
  currentDecision?: string;
  currentDevice?: string;
  currentVersion?: string;
  currentSort?: string;
  initialSelectedId?: string;
  queryError?: string | null;
}

export function ConsentTrackingView({
  records,
  totalCount,
  page,
  pageSize,
  totalPages,
  decisionCounts,
  currentSearch = "",
  currentDecision = "all",
  currentDevice = "all",
  currentVersion = "all",
  currentSort = "newest",
  initialSelectedId,
  queryError,
}: ConsentTrackingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input local state
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Selected record for detail audit panel
  const initialRecord =
    records.find((r) => r.id === initialSelectedId) || null;
  const [selectedRecord, setSelectedRecord] =
    useState<ConsentRecord | null>(initialRecord);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle copy text helper
  async function handleCopy(text: string, identifier: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(identifier);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  }

  // Update URL search parameters
  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset to page 1 on filter/search changes unless page is explicitly updated
    if (!updates.page && updates.page !== null) {
      params.delete("page");
    }
    router.push(`/dashboard/consent-tracking?${params.toString()}`);
  }

  // Handle search submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: searchValue.trim() || null, page: null });
  }

  const isFiltersActive =
    currentSearch !== "" ||
    (currentDecision !== "all" && currentDecision !== "") ||
    (currentDevice !== "all" && currentDevice !== "") ||
    (currentVersion !== "all" && currentVersion !== "") ||
    currentSort !== "newest";

  const decisionTabs: Array<{ id: string; label: string; count: number }> = [
    { id: "all", label: "All Logs", count: decisionCounts.all },
    { id: "full", label: "Full Consent", count: decisionCounts.full },
    { id: "essential_only", label: "Essential Only", count: decisionCounts.essential_only },
    { id: "analytics", label: "Analytics Accepted", count: decisionCounts.analytics },
    { id: "marketing", label: "Marketing Accepted", count: decisionCounts.marketing },
  ];

  // Helper for device icon
  function renderDeviceIcon(category: UserAgentCategory | null) {
    switch (category) {
      case "desktop":
        return <Laptop className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
      case "mobile":
        return <Smartphone className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
      case "tablet":
        return <Tablet className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
      case "bot":
        return <Bot className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />;
    }
  }

  // Acceptance rate calculation
  const fullConsentRate =
    decisionCounts.all > 0
      ? Math.round((decisionCounts.full / decisionCounts.all) * 100)
      : 0;
  const analyticsRate =
    decisionCounts.all > 0
      ? Math.round((decisionCounts.analytics / decisionCounts.all) * 100)
      : 0;
  const marketingRate =
    decisionCounts.all > 0
      ? Math.round((decisionCounts.marketing / decisionCounts.all) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-radial from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Consent Tracking
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                <ShieldCheck className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span>Audit &amp; Compliance Mode</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Audit privacy-compliant cookie preferences, consent versioning, and client environment logs.
              Protected by immutable read-only policies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2">
              <span className="text-xs text-zinc-400">Total Consents:</span>
              <span className="font-mono text-sm font-bold text-white">
                {totalCount.toLocaleString()}
              </span>
            </div>
            {totalCount > 0 && (
              <>
                <div
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-emerald-300"
                  title={`${decisionCounts.full} of ${totalCount} visitors accepted all cookies`}
                >
                  <span className="text-xs font-semibold">
                    {fullConsentRate}% Full Acceptance
                  </span>
                </div>
                <div
                  className="hidden sm:flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-sky-300"
                  title={`${decisionCounts.analytics} visitors granted analytics`}
                >
                  <span className="text-xs font-semibold">
                    {analyticsRate}% Analytics
                  </span>
                </div>
                <div
                  className="hidden sm:flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-purple-300"
                  title={`${decisionCounts.marketing} visitors granted marketing`}
                >
                  <span className="text-xs font-semibold">
                    {marketingRate}% Marketing
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {queryError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-red-200">Database Query Error</div>
            <p className="mt-0.5 text-red-300/90 leading-relaxed font-mono">{queryError}</p>
          </div>
        </div>
      )}

      {/* Decision Tabs & Filter Controls */}
      <div className="space-y-3">
        {/* Decision Filter Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Consent decision filters"
        >
          {decisionTabs.map((tab) => {
            const isSelected = currentDecision === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => updateFilters({ decision: tab.id, page: null })}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold shadow-xs"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-200 font-bold"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar, Device & Sort Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-500" aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by anonymous session ID or record UUID..."
              className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/70 py-2 pr-4 pl-9 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Device Filter */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Filter className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
              <span>Device:</span>
            </div>
            <select
              value={currentDevice}
              onChange={(e) => updateFilters({ device: e.target.value, page: null })}
              className="rounded-lg border border-zinc-700/80 bg-zinc-950/70 py-2 pr-8 pl-2.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
              aria-label="Filter by client device"
            >
              <option value="all">All Devices</option>
              {VALID_USER_AGENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sortBy: e.target.value, page: null })}
              className="rounded-lg border border-zinc-700/80 bg-zinc-950/70 py-2 pr-8 pl-2.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
              aria-label="Sort consent records"
            >
              <option value="newest">Newest Logged</option>
              <option value="oldest">Oldest Logged</option>
            </select>

            {/* Reset Filters */}
            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  router.push("/dashboard/consent-tracking");
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-xs text-zinc-300 hover:text-white"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Consent Records Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl overflow-hidden">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 mb-3">
              <Cookie className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {isFiltersActive ? "No matching consent logs found" : "No consent records yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed">
              {isFiltersActive
                ? "Try adjusting your search session ID or switching decision and device filters."
                : "Privacy-compliant cookie consent logs from website visitors will appear here for audit and compliance monitoring."}
            </p>
            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  router.push("/dashboard/consent-tracking");
                }}
                className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-6 pr-4">Anonymous Session ID</th>
                  <th className="py-3.5 px-4">Policy Version</th>
                  <th className="py-3.5 px-4">Essential</th>
                  <th className="py-3.5 px-4">Analytics</th>
                  <th className="py-3.5 px-4">Marketing</th>
                  <th className="py-3.5 px-4">Client Device</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Recorded At</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {records.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  const maskedSession =
                    record.anonymous_session_id.length > 16
                      ? `${record.anonymous_session_id.slice(0, 10)}...${record.anonymous_session_id.slice(-6)}`
                      : record.anonymous_session_id;

                  return (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`cursor-pointer transition-colors hover:bg-zinc-800/30 ${
                        isSelected ? "bg-zinc-800/40" : ""
                      }`}
                    >
                      {/* Anonymous Session ID */}
                      <td className="py-4 pl-6 pr-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-white font-medium hover:text-amber-300"
                            title={record.anonymous_session_id}
                          >
                            {maskedSession}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(record.anonymous_session_id, record.id);
                            }}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                            title="Copy full session ID"
                            aria-label="Copy session ID"
                          >
                            {copiedId === record.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-sans mt-0.5">
                          ID: {record.id.slice(0, 8)}...
                        </div>
                      </td>

                      {/* Policy Version */}
                      <td className="py-4 px-4 font-mono text-zinc-300">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                          v{record.consent_version}
                        </span>
                      </td>

                      {/* Essential */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                          <span>Required</span>
                        </span>
                      </td>

                      {/* Analytics */}
                      <td className="py-4 px-4">
                        {record.analytics ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                            <span>Granted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                            <XCircle className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Marketing */}
                      <td className="py-4 px-4">
                        {record.marketing ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                            <span>Granted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                            <XCircle className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Client Device */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 capitalize text-zinc-300">
                          {renderDeviceIcon(record.user_agent_category)}
                          <span>{record.user_agent_category || "Unknown"}</span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 hidden md:table-cell text-zinc-400 whitespace-nowrap">
                        {formatDateTime(record.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(record);
                          }}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-amber-500/50 hover:bg-zinc-700 hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-3 border-t border-zinc-800/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400">
            <div>
              Showing{" "}
              <span className="font-semibold text-white">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-white">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-white">{totalCount}</span>{" "}
              records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <span className="px-2 text-xs text-zinc-500 font-mono">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:pointer-events-none disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Audit Detail Modal / Drawer */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-audit-title"
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-400">
                  <Cookie className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="consent-audit-title"
                    className="text-base font-bold text-white"
                  >
                    Consent Audit Record
                  </h2>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    ID: {selectedRecord.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-zinc-300">
              {/* Session Identity & Policy Version */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Session &amp; Governance Metadata
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px]">Anonymous Session ID:</span>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-zinc-200">
                    <span className="truncate pr-2">{selectedRecord.anonymous_session_id}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedRecord.anonymous_session_id,
                          "modal-session"
                        )
                      }
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white shrink-0"
                      title="Copy anonymous session ID"
                    >
                      {copiedId === "modal-session" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px]">Policy Version:</span>
                    <div className="mt-0.5 font-semibold text-white font-mono">
                      v{selectedRecord.consent_version}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">Client Environment:</span>
                    <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-white capitalize">
                      {renderDeviceIcon(selectedRecord.user_agent_category)}
                      <span>{selectedRecord.user_agent_category || "Unknown"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Consent Choices Breakdown */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Category Preferences
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Essential */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div>
                      <div className="font-semibold text-white">Strictly Necessary Cookies</div>
                      <div className="text-[11px] text-zinc-400">
                        Essential session tokens, CSRF protection, and security features.
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Always Active</span>
                    </span>
                  </div>

                  {/* Analytics */}
                  <div
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      selectedRecord.analytics
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-zinc-800 bg-zinc-950/40"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">Performance &amp; Analytics</div>
                      <div className="text-[11px] text-zinc-400">
                        Anonymous page view telemetry and navigation performance metrics.
                      </div>
                    </div>
                    {selectedRecord.analytics ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400 shrink-0">
                        <XCircle className="h-3 w-3" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>

                  {/* Marketing */}
                  <div
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      selectedRecord.marketing
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-zinc-800 bg-zinc-950/40"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">Marketing &amp; Targeting</div>
                      <div className="text-[11px] text-zinc-400">
                        Conversion attribution and marketing campaign effectiveness logs.
                      </div>
                    </div>
                    {selectedRecord.marketing ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400 shrink-0">
                        <XCircle className="h-3 w-3" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-2">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Audit Timestamps
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Recorded At:
                    </span>
                    <div className="mt-0.5 font-medium text-white">
                      {formatDateTime(selectedRecord.created_at)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {selectedRecord.created_at}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Updated At:
                    </span>
                    <div className="mt-0.5 font-medium text-white">
                      {formatDateTime(selectedRecord.updated_at)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {selectedRecord.updated_at}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Architecture Notice */}
              <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5 text-[11px] text-zinc-400">
                <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-zinc-200">Compliance Notice:</span> Raw IP addresses and personal identifiers are strictly excluded from storage to uphold GDPR &amp; ePrivacy data minimization standards. Historical records are immutable under active-founder row-level security.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-800 bg-zinc-950/60 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
