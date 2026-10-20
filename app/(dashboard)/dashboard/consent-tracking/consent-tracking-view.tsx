"use client";

import { useState, useTransition, useEffect } from "react";
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
import { useNavProgress } from "@/components/ui/nav-progress";

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
  const { startNavTransition } = useNavProgress();

  // Search input local state
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [prevCurrentSearch, setPrevCurrentSearch] = useState(currentSearch);
  if (prevCurrentSearch !== currentSearch) {
    setPrevCurrentSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  // Optimistic filter states for instant response (<10ms)
  const [optimisticDecision, setOptimisticDecision] = useState<string>(currentDecision);
  const [prevCurrentDecision, setPrevCurrentDecision] = useState(currentDecision);
  if (prevCurrentDecision !== currentDecision) {
    setPrevCurrentDecision(currentDecision);
    setOptimisticDecision(currentDecision);
  }

  const [optimisticDevice, setOptimisticDevice] = useState<string>(currentDevice);
  const [prevCurrentDevice, setPrevCurrentDevice] = useState(currentDevice);
  if (prevCurrentDevice !== currentDevice) {
    setPrevCurrentDevice(currentDevice);
    setOptimisticDevice(currentDevice);
  }

  const [optimisticSort, setOptimisticSort] = useState<string>(currentSort);
  const [prevCurrentSort, setPrevCurrentSort] = useState(currentSort);
  if (prevCurrentSort !== currentSort) {
    setPrevCurrentSort(currentSort);
    setOptimisticSort(currentSort);
  }

  const [isFiltering, startFilterTransition] = useTransition();

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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedRecord) {
        setSelectedRecord(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRecord]);

  // Update URL search parameters with optimistic feedback
  function updateFilters(updates: Record<string, string | null>) {
    if ("decision" in updates) {
      setOptimisticDecision(updates.decision || "all");
    }
    if ("device" in updates) {
      setOptimisticDevice(updates.device || "all");
    }
    if ("sortBy" in updates) {
      setOptimisticSort(updates.sortBy || "newest");
    }

    startNavTransition(() => {
      startFilterTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === "" || value === "all") {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        });
        if (!updates.page && updates.page !== null) {
          params.delete("page");
        }
        router.push(`/dashboard/consent-tracking?${params.toString()}`);
      });
    });
  }

  // Handle search submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: searchValue.trim() || null, page: null });
  }

  // Handle search clear
  function handleClearSearch() {
    setSearchValue("");
    updateFilters({ q: null, page: null });
  }

  const isFiltersActive =
    currentSearch !== "" ||
    (optimisticDecision !== "all" && optimisticDecision !== "") ||
    (optimisticDevice !== "all" && optimisticDevice !== "") ||
    (currentVersion !== "all" && currentVersion !== "") ||
    optimisticSort !== "newest";

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
        return <Laptop className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />;
      case "mobile":
        return <Smartphone className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />;
      case "tablet":
        return <Tablet className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />;
      case "bot":
        return <Bot className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
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
      {/* Header and Compliance Summary Banner */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>ePrivacy &amp; GDPR Compliant · Anonymous Telemetry</span>
            </div>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              Cookie Consent Tracking
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
              Immutable audit log of user privacy choices submitted via the public consent banner.
            </p>
          </div>

          {/* Aggregate Acceptance Rates */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3.5 py-2">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Full Consent Rate
              </div>
              <div className="text-sm font-bold text-emerald-700 font-mono">
                {fullConsentRate}%
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3.5 py-2">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Analytics Opt-in
              </div>
              <div className="text-sm font-bold text-zinc-800 font-mono">
                {analyticsRate}%
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3.5 py-2">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Marketing Opt-in
              </div>
              <div className="text-sm font-bold text-zinc-800 font-mono">
                {marketingRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {queryError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-rose-900">Database Query Error</div>
            <p className="mt-0.5 text-rose-700 leading-relaxed font-mono">{queryError}</p>
          </div>
        </div>
      )}

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="space-y-3">
        {/* Status Filter Tabs - Immediate (<10ms) responsive highlighting */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {decisionTabs.map((tab) => {
            const isSelected = optimisticDecision === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => updateFilters({ decision: tab.id, page: null })}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected
                      ? "bg-emerald-100 text-emerald-800 font-bold"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Dropdown Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by anonymous session token..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-1.5 pr-8 pl-9 text-xs text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-2.5 my-auto h-4 w-4 text-zinc-400 hover:text-zinc-600"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Device Filter Dropdown */}
            <select
              value={optimisticDevice}
              onChange={(e) => updateFilters({ device: e.target.value, page: null })}
              className="rounded-lg border border-zinc-200 bg-white py-1.5 pr-8 pl-2.5 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Devices</option>
              {VALID_USER_AGENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Filter className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            </div>
            <select
              value={optimisticSort}
              onChange={(e) => updateFilters({ sortBy: e.target.value, page: null })}
              className="rounded-lg border border-zinc-200 bg-white py-1.5 pr-8 pl-2.5 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest Recorded</option>
              <option value="oldest">Oldest Recorded</option>
            </select>

            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setOptimisticDecision("all");
                  setOptimisticDevice("all");
                  setOptimisticSort("newest");
                  router.push("/dashboard/consent-tracking");
                }}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
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
      <div className={`relative rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden transition-opacity ${isFiltering ? "opacity-60" : "opacity-100"}`}>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 mb-3 shadow-2xs">
              <Cookie className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {isFiltersActive ? "No matching consent logs found" : "No consent records yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed">
              {isFiltersActive
                ? "Try clearing device or decision filters to see more results."
                : "Consent decisions recorded on dezprox.com will appear here for compliance auditing."}
            </p>
            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setOptimisticDecision("all");
                  setOptimisticDevice("all");
                  setOptimisticSort("newest");
                  router.push("/dashboard/consent-tracking");
                }}
                className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-2xs cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 pl-6 pr-4">Anonymous Session</th>
                  <th className="py-3 px-4">Policy</th>
                  <th className="py-3 px-4">Essential</th>
                  <th className="py-3 px-4">Analytics</th>
                  <th className="py-3 px-4">Marketing</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Recorded At</th>
                  <th className="py-3 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700 font-mono">
                {records.map((record) => {
                  const maskedSession =
                    record.anonymous_session_id.length > 14
                      ? `${record.anonymous_session_id.slice(0, 10)}...`
                      : record.anonymous_session_id;

                  const isSelected = selectedRecord?.id === record.id;

                  return (
                    <tr
                      key={record.id}
                      className={`transition-colors hover:bg-zinc-50/80 ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Session ID + Copy button */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                          <span>{maskedSession}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(record.anonymous_session_id, record.id)
                            }
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                            title="Copy full session token"
                          >
                            {copiedId === record.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Policy Version */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500">
                        v{record.consent_version}
                      </td>

                      {/* Essential */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.2 text-[10px] font-medium text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Analytics */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        {record.analytics ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.2 text-[10px] font-medium text-emerald-800">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            <span>Granted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.2 text-[10px] font-medium text-zinc-400">
                            <XCircle className="h-2.5 w-2.5 text-zinc-400" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Marketing */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                        {record.marketing ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.2 text-[10px] font-medium text-emerald-800">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            <span>Granted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.2 text-[10px] font-medium text-zinc-400">
                            <XCircle className="h-2.5 w-2.5 text-zinc-400" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* Device category */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-sans capitalize text-zinc-700">
                        <div className="flex items-center gap-1.5">
                          {renderDeviceIcon(record.user_agent_category)}
                          <span>{record.user_agent_category || "Unknown"}</span>
                        </div>
                      </td>

                      {/* Recorded At */}
                      <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap font-mono text-zinc-400">
                        {formatDateTime(record.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                        >
                          <span>Audit</span>
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
          <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-zinc-800">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-zinc-800">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-zinc-800">{totalCount}</span>{" "}
              records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <span className="px-2 text-xs font-medium text-zinc-600 font-mono">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Audit Detail Modal / Drawer */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 transition-opacity"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-audit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
          }}
        >
          <div className="relative w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 shadow-2xs">
                  <Cookie className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="consent-audit-title"
                    className="text-base font-bold text-zinc-900"
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
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-zinc-700">
              {/* Session Identity & Policy Version */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Session &amp; Governance Metadata
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px]">Anonymous Session ID:</span>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2 font-mono text-zinc-800">
                    <span className="truncate pr-2">{selectedRecord.anonymous_session_id}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedRecord.anonymous_session_id,
                          "modal-session"
                        )
                      }
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 shrink-0 cursor-pointer"
                      title="Copy anonymous session ID"
                    >
                      {copiedId === "modal-session" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px]">Policy Version:</span>
                    <div className="mt-0.5 font-semibold text-zinc-900 font-mono">
                      v{selectedRecord.consent_version}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">Client Environment:</span>
                    <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-zinc-900 capitalize">
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
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <div>
                      <div className="font-semibold text-zinc-900">Strictly Necessary Cookies</div>
                      <div className="text-[11px] text-zinc-500">
                        Essential session tokens, CSRF protection, and security features.
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                      <span>Always Active</span>
                    </span>
                  </div>

                  {/* Analytics */}
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      selectedRecord.analytics
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-zinc-200 bg-zinc-50/50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-zinc-900">Performance &amp; Analytics</div>
                      <div className="text-[11px] text-zinc-500">
                        Anonymous page view telemetry and navigation performance metrics.
                      </div>
                    </div>
                    {selectedRecord.analytics ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 shrink-0">
                        <XCircle className="h-3 w-3" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>

                  {/* Marketing */}
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      selectedRecord.marketing
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-zinc-200 bg-zinc-50/50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-zinc-900">Marketing &amp; Targeting</div>
                      <div className="text-[11px] text-zinc-500">
                        Conversion attribution and marketing campaign effectiveness logs.
                      </div>
                    </div>
                    {selectedRecord.marketing ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 shrink-0">
                        <XCircle className="h-3 w-3" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-2">
                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Audit Timestamps
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Recorded At:
                    </span>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {formatDateTime(selectedRecord.created_at)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {selectedRecord.created_at}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Updated At:
                    </span>
                    <div className="mt-0.5 font-medium text-zinc-800">
                      {formatDateTime(selectedRecord.updated_at)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {selectedRecord.updated_at}
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Architecture Notice */}
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-900">
                <Lock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  <span className="font-semibold text-amber-950">Compliance Notice:</span> Raw IP addresses and personal identifiers are strictly excluded from storage to uphold GDPR &amp; ePrivacy data minimization standards. Historical records are immutable under active-founder row-level security.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
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
