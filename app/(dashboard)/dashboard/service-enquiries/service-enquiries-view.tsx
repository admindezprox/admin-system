"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  Calendar,
} from "lucide-react";
import type {
  ServiceEnquiryWithFounder,
  ServiceEnquiryStatusCounts,
} from "@/lib/service-enquiries/queries";
import type { ServiceEnquiryStatus } from "@/lib/supabase/types";
import {
  updateServiceEnquiryAction,
  type UpdateServiceEnquiryActionState,
} from "@/lib/service-enquiries/actions";
import {
  formatStatusBadge,
  formatServiceCategory,
  formatBudgetTier,
  formatDateTime,
} from "@/lib/dashboard/formatters";
import {
  VALID_SERVICE_ENQUIRY_STATUSES,
  VALID_SERVICE_CATEGORIES,
} from "@/lib/service-enquiries/validation";
import { useNavProgress } from "@/components/ui/nav-progress";

interface ServiceEnquiriesViewProps {
  enquiries: ServiceEnquiryWithFounder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: ServiceEnquiryStatusCounts;
  currentSearch?: string;
  currentStatus?: string;
  currentCategory?: string;
  currentSort?: string;
  initialSelectedId?: string;
  queryError?: string | null;
  activeFounderName?: string;
  activeFounderId?: string;
}

export function ServiceEnquiriesView({
  enquiries: initialEnquiries,
  totalCount,
  page,
  pageSize,
  totalPages,
  statusCounts,
  currentSearch = "",
  currentStatus = "all",
  currentCategory = "all",
  currentSort = "newest",
  initialSelectedId,
  queryError,
  activeFounderName = "Founder",
  activeFounderId,
}: ServiceEnquiriesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNavTransition } = useNavProgress();

  // Local copy of enquiries to reflect mutations instantly
  const [enquiriesList, setEnquiriesList] = useState<ServiceEnquiryWithFounder[]>(initialEnquiries);
  const [prevInitialEnquiries, setPrevInitialEnquiries] = useState(initialEnquiries);
  if (prevInitialEnquiries !== initialEnquiries) {
    setPrevInitialEnquiries(initialEnquiries);
    setEnquiriesList(initialEnquiries);
  }

  // Search input local state
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [prevCurrentSearch, setPrevCurrentSearch] = useState(currentSearch);
  if (prevCurrentSearch !== currentSearch) {
    setPrevCurrentSearch(currentSearch);
    setSearchValue(currentSearch);
  }

  // Optimistic filter states for immediate UI feedback (<10ms)
  const [optimisticStatus, setOptimisticStatus] = useState<string>(currentStatus);
  const [prevCurrentStatus, setPrevCurrentStatus] = useState(currentStatus);
  if (prevCurrentStatus !== currentStatus) {
    setPrevCurrentStatus(currentStatus);
    setOptimisticStatus(currentStatus);
  }

  const [optimisticCategory, setOptimisticCategory] = useState<string>(currentCategory);
  const [prevCurrentCategory, setPrevCurrentCategory] = useState(currentCategory);
  if (prevCurrentCategory !== currentCategory) {
    setPrevCurrentCategory(currentCategory);
    setOptimisticCategory(currentCategory);
  }

  const [optimisticSort, setOptimisticSort] = useState<string>(currentSort);
  const [prevCurrentSort, setPrevCurrentSort] = useState(currentSort);
  if (prevCurrentSort !== currentSort) {
    setPrevCurrentSort(currentSort);
    setOptimisticSort(currentSort);
  }

  const [isFiltering, startFilterTransition] = useTransition();

  // Selected enquiry for detail panel
  const initialEnquiry =
    enquiriesList.find((e) => e.id === initialSelectedId) || null;
  const [selectedEnquiry, setSelectedEnquiry] =
    useState<ServiceEnquiryWithFounder | null>(initialEnquiry);

  // Status and assignment update form state
  const [newStatus, setNewStatus] = useState<ServiceEnquiryStatus | "">("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [assignToMe, setAssignToMe] = useState<boolean>(false);
  const [unassign, setUnassign] = useState<boolean>(false);
  const [updateState, setUpdateState] = useState<UpdateServiceEnquiryActionState>({
    success: false,
    error: null,
  });
  const [isUpdating, startUpdateTransition] = useTransition();

  // Handle open detail panel
  function handleOpenDetails(enquiry: ServiceEnquiryWithFounder) {
    setSelectedEnquiry(enquiry);
    setNewStatus(enquiry.status);
    setInternalNotes(enquiry.internal_notes || "");
    setAssignToMe(false);
    setUnassign(false);
    setUpdateState({ success: false, error: null });
  }

  // Handle close detail panel
  function handleCloseDetails() {
    setSelectedEnquiry(null);
  }

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedEnquiry) {
        handleCloseDetails();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEnquiry]);

  // Update URL search parameters with optimistic feedback
  function updateFilters(updates: Record<string, string | null>) {
    if ("status" in updates) {
      setOptimisticStatus(updates.status || "all");
    }
    if ("category" in updates) {
      setOptimisticCategory(updates.category || "all");
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
        router.push(`/dashboard/service-enquiries?${params.toString()}`);
      });
    });
  }

  // Handle search submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: searchValue.trim() || null, page: null });
  }

  // Handle clear search
  function handleClearSearch() {
    setSearchValue("");
    updateFilters({ q: null, page: null });
  }

  // Handle status update submission
  function handleStatusUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEnquiry || !newStatus) return;

    const formData = new FormData();
    formData.set("enquiryId", selectedEnquiry.id);
    formData.set("status", newStatus);
    formData.set("internalNotes", internalNotes);

    if (assignToMe) {
      formData.set("assignToMe", "true");
    } else if (unassign) {
      formData.set("assignedFounderId", "unassigned");
    }

    startUpdateTransition(async () => {
      const res = await updateServiceEnquiryAction(
        { success: false, error: null },
        formData
      );
      setUpdateState(res);
      if (res.success) {
        const updatedAssignedProfile = assignToMe
          ? { id: activeFounderId || "me", full_name: activeFounderName, email: "" }
          : unassign
          ? null
          : selectedEnquiry.assigned_founder_profile;

        const updatedEnquiry = {
          ...selectedEnquiry,
          status: newStatus as ServiceEnquiryStatus,
          internal_notes: internalNotes || null,
          assigned_founder: assignToMe ? activeFounderId || null : unassign ? null : selectedEnquiry.assigned_founder,
          assigned_founder_profile: updatedAssignedProfile,
        };

        setSelectedEnquiry(updatedEnquiry);

        setEnquiriesList((prev) =>
          prev.map((item) =>
            item.id === selectedEnquiry.id ? updatedEnquiry : item
          )
        );
      }
    });
  }

  const isFiltersActive =
    currentSearch !== "" ||
    (optimisticStatus !== "all" && optimisticStatus !== "") ||
    (optimisticCategory !== "all" && optimisticCategory !== "") ||
    optimisticSort !== "newest";

  const statusTabs: Array<{ id: string; label: string; count: number }> = [
    { id: "all", label: "All", count: statusCounts.all },
    { id: "new", label: "New", count: statusCounts.new },
    { id: "contacted", label: "Contacted", count: statusCounts.contacted },
    { id: "discovery_scheduled", label: "Discovery", count: statusCounts.discovery_scheduled },
    { id: "proposal_sent", label: "Proposal", count: statusCounts.proposal_sent },
    { id: "closed_won", label: "Closed Won", count: statusCounts.closed_won },
    { id: "closed_lost", label: "Closed Lost", count: statusCounts.closed_lost },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 shadow-2xs">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                Service & Project Enquiries
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Manage client projects, quote requests, and discovery pipeline stages.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs">
              <span className="text-zinc-500">Total Projects:</span>
              <span className="font-semibold text-zinc-900 font-mono">{totalCount}</span>
            </div>
            {statusCounts.new > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-semibold font-mono">{statusCounts.new}</span>
                <span>new opportunities</span>
              </div>
            )}
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
          {statusTabs.map((tab) => {
            const isSelected = optimisticStatus === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => updateFilters({ status: tab.id, page: null })}
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

        {/* Search Bar, Category Dropdown & Sort Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by prospect name, email, company, or description..."
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
            {/* Category Filter Dropdown */}
            <select
              value={optimisticCategory}
              onChange={(e) => updateFilters({ category: e.target.value, page: null })}
              className="rounded-lg border border-zinc-200 bg-white py-1.5 pr-8 pl-2.5 text-xs text-zinc-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Service Categories</option>
              {VALID_SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {formatServiceCategory(cat)}
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
              <option value="newest">Newest Submitted</option>
              <option value="oldest">Oldest Submitted</option>
            </select>

            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setOptimisticStatus("all");
                  setOptimisticCategory("all");
                  setOptimisticSort("newest");
                  router.push("/dashboard/service-enquiries");
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

      {/* Service Enquiries Table */}
      <div className={`relative rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden transition-opacity ${isFiltering ? "opacity-60" : "opacity-100"}`}>
        {enquiriesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 mb-3 shadow-2xs">
              <Briefcase className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800">
              {isFiltersActive ? "No matching project enquiries found" : "No project enquiries yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed">
              {isFiltersActive
                ? "Try clearing category filters or adjusting search keywords."
                : "Project requests submitted on dezprox.com will appear here automatically."}
            </p>
            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setOptimisticStatus("all");
                  setOptimisticCategory("all");
                  setOptimisticSort("newest");
                  router.push("/dashboard/service-enquiries");
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
                  <th className="py-3 pl-6 pr-4">Prospect & Company</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Budget Tier</th>
                  <th className="py-3 px-4">Status & Assignment</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Submitted</th>
                  <th className="py-3 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {enquiriesList.map((enquiry) => {
                  const status = formatStatusBadge(enquiry.status);
                  const isSelected = selectedEnquiry?.id === enquiry.id;

                  return (
                    <tr
                      key={enquiry.id}
                      className={`transition-colors hover:bg-zinc-50/80 ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Prospect & Company */}
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="font-semibold text-zinc-900">{enquiry.full_name}</div>
                        <div className="text-zinc-500">{enquiry.email}</div>
                        {enquiry.company_name && (
                          <div className="mt-0.5 text-[11px] text-zinc-400">
                            {enquiry.company_name}
                          </div>
                        )}
                      </td>

                      {/* Service Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">
                          {formatServiceCategory(enquiry.service_category)}
                        </div>
                        {enquiry.estimated_timeline && (
                          <div className="mt-0.5 text-[11px] text-zinc-500">
                            Timeline: {enquiry.estimated_timeline}
                          </div>
                        )}
                      </td>

                      {/* Budget Tier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-zinc-700">
                          {formatBudgetTier(enquiry.budget_tier)}
                        </span>
                      </td>

                      {/* Status & Assignment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                        {enquiry.assigned_founder_profile && (
                          <div
                            className="mt-1 text-[10px] text-emerald-800 font-medium truncate max-w-[130px]"
                            title={`Assigned to ${enquiry.assigned_founder_profile.full_name}`}
                          >
                            Lead: {enquiry.assigned_founder_profile.full_name}
                          </div>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap font-mono text-zinc-400">
                        {formatDateTime(enquiry.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(enquiry)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                        >
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-3.5 sm:flex-row">
            <div className="text-xs text-zinc-500">
              Showing{" "}
              <span className="font-semibold text-zinc-800">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-zinc-800">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-zinc-800">{totalCount}</span>{" "}
              projects
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

              <span className="px-2 text-xs font-medium text-zinc-600">
                Page {page} of {totalPages}
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

      {/* Service Enquiry Details & Pipeline Management Drawer */}
      {selectedEnquiry && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetails();
          }}
        >
          <div className="relative flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="service-detail-title"
                    className="text-base font-bold text-zinc-900"
                  >
                    Project Enquiry
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-400">
                    ID: {selectedEnquiry.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 space-y-6 p-6">
              {/* Feedback Alerts */}
              {updateState.success && (
                <div
                  role="status"
                  className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>Project enquiry status, notes, and assignment updated successfully!</span>
                </div>
              )}

              {updateState.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                  <span>{updateState.error}</span>
                </div>
              )}

              {/* Client & Contact Information */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] text-zinc-400">Full Name</div>
                    <div className="mt-0.5 text-xs font-semibold text-zinc-900">
                      {selectedEnquiry.full_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-400">Email Address</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <a
                        href={`mailto:${selectedEnquiry.email}`}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        {selectedEnquiry.email}
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-400">Phone Number</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      {selectedEnquiry.phone ? (
                        <a
                          href={`tel:${selectedEnquiry.phone}`}
                          className="text-xs font-mono font-semibold text-zinc-800 hover:underline"
                        >
                          {selectedEnquiry.phone}
                        </a>
                      ) : (
                        <span className="text-xs italic text-zinc-400">Not provided</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-400">Company Name</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-700">
                      <Building2 className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <span>{selectedEnquiry.company_name || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Specifications */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Project Scope & Requirements
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-[11px] text-zinc-400">Service Category</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                      <Sparkles className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                      <span>{formatServiceCategory(selectedEnquiry.service_category)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-400">Budget Tier</div>
                    <div className="mt-0.5 text-xs font-semibold text-zinc-800">
                      {formatBudgetTier(selectedEnquiry.budget_tier)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-400">Estimated Timeline</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-700">
                      <Calendar className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                      <span>{selectedEnquiry.estimated_timeline || "Flexible / Not specified"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-400">Project Description</div>
                  <div className="mt-1 rounded-lg border border-zinc-200 bg-white p-3.5 text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedEnquiry.project_description}
                  </div>
                </div>
              </div>

              {/* Status Update, Assignment & Notes Form */}
              <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
                <div className="rounded-xl border border-zinc-200/80 bg-white p-4 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Pipeline & Status Control
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-500">Current:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-medium ${
                          formatStatusBadge(selectedEnquiry.status).badgeClass
                        }`}
                      >
                        {formatStatusBadge(selectedEnquiry.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label
                      htmlFor="update-status"
                      className="block text-xs font-medium text-zinc-700 mb-1"
                    >
                      Update Pipeline Status
                    </label>
                    <select
                      id="update-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ServiceEnquiryStatus)}
                      disabled={isUpdating}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                    >
                      {VALID_SERVICE_ENQUIRY_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st === "discovery_scheduled"
                            ? "Discovery Scheduled"
                            : st === "proposal_sent"
                            ? "Proposal Sent"
                            : st === "closed_won"
                            ? "Closed Won"
                            : st === "closed_lost"
                            ? "Closed Lost"
                            : st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Founder Assignment Control */}
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-zinc-700">
                        Lead Assignment
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {selectedEnquiry.assigned_founder_profile ? (
                          <span className="text-emerald-800 font-semibold">
                            Assigned to {selectedEnquiry.assigned_founder_profile.full_name}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">Currently Unassigned</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignToMe}
                          onChange={(e) => {
                            setAssignToMe(e.target.checked);
                            if (e.target.checked) setUnassign(false);
                          }}
                          disabled={isUpdating}
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Assign to me ({activeFounderName})</span>
                      </label>

                      {selectedEnquiry.assigned_founder && (
                        <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={unassign}
                            onChange={(e) => {
                              setUnassign(e.target.checked);
                              if (e.target.checked) setAssignToMe(false);
                            }}
                            disabled={isUpdating}
                            className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-rose-600">Unassign lead</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Internal Notes Textarea */}
                  <div>
                    <label
                      htmlFor="internal-notes"
                      className="block text-xs font-medium text-zinc-700 mb-1"
                    >
                      Internal Notes (Founder Eyes Only)
                    </label>
                    <textarea
                      id="internal-notes"
                      rows={4}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      disabled={isUpdating}
                      placeholder="Add private founder notes, project qualification details, discovery call links, or pricing estimations..."
                      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>Updating Project Enquiry...</span>
                        </>
                      ) : (
                        <span>Save Status, Notes & Assignment</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Audit Timestamps */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div>Submitted: {formatDateTime(selectedEnquiry.created_at)}</div>
                <div>Last Updated: {formatDateTime(selectedEnquiry.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
