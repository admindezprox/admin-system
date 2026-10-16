"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  RotateCcw,
} from "lucide-react";
import type { BookingWithFounder, BookingStatusCounts } from "@/lib/bookings/queries";
import type { BookingStatus } from "@/lib/supabase/types";
import { updateBookingAction, type UpdateBookingActionState } from "@/lib/bookings/actions";
import { formatStatusBadge, formatDateTime, formatDateOnly } from "@/lib/dashboard/formatters";
import { VALID_BOOKING_STATUSES } from "@/lib/bookings/validation";

interface BookingsViewProps {
  bookings: BookingWithFounder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: BookingStatusCounts;
  currentSearch?: string;
  currentStatus?: string;
  currentSort?: string;
  initialSelectedId?: string;
  queryError?: string | null;
}

export function BookingsView({
  bookings,
  totalCount,
  page,
  pageSize,
  totalPages,
  statusCounts,
  currentSearch = "",
  currentStatus = "all",
  currentSort = "newest",
  initialSelectedId,
  queryError,
}: BookingsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search input local state
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Selected booking for detail panel
  const initialBooking =
    bookings.find((b) => b.id === initialSelectedId) || null;
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithFounder | null>(initialBooking);

  // Status and notes update form state
  const [newStatus, setNewStatus] = useState<BookingStatus | "">("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [updateState, setUpdateState] = useState<UpdateBookingActionState>({
    success: false,
    error: null,
  });
  const [isUpdating, startUpdateTransition] = useTransition();

  // Handle open detail panel
  function handleOpenDetails(booking: BookingWithFounder) {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setInternalNotes(booking.internal_notes || "");
    setUpdateState({ success: false, error: null });
  }

  // Handle close detail panel
  function handleCloseDetails() {
    setSelectedBooking(null);
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
    // Reset to page 1 on filter/search changes if page is not explicitly updated
    if (!updates.page && updates.page !== null) {
      params.delete("page");
    }
    router.push(`/dashboard/bookings?${params.toString()}`);
  }

  // Handle search submit
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ q: searchValue.trim() || null, page: null });
  }

  // Handle status update submission
  function handleStatusUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBooking || !newStatus) return;

    const formData = new FormData();
    formData.set("bookingId", selectedBooking.id);
    formData.set("status", newStatus);
    formData.set("internalNotes", internalNotes);

    startUpdateTransition(async () => {
      const res = await updateBookingAction(
        { success: false, error: null },
        formData
      );
      setUpdateState(res);
      if (res.success) {
        // Update local object to reflect new state
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as BookingStatus,
                internal_notes: internalNotes || null,
              }
            : null
        );
      }
    });
  }

  const isFiltersActive =
    currentSearch !== "" ||
    (currentStatus !== "all" && currentStatus !== "") ||
    currentSort !== "newest";

  const statusTabs: Array<{ id: string; label: string; count: number }> = [
    { id: "all", label: "All", count: statusCounts.all },
    { id: "pending", label: "Pending", count: statusCounts.pending },
    { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
    { id: "rescheduled", label: "Rescheduled", count: statusCounts.rescheduled },
    { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
    { id: "completed", label: "Completed", count: statusCounts.completed },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Summary Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-radial from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-400">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Booking Requests
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Manage consultation call requests, review client schedules, and update booking statuses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2">
              <span className="text-xs text-zinc-400">Total Bookings:</span>
              <span className="font-mono text-sm font-bold text-white">
                {totalCount}
              </span>
            </div>
            {statusCounts.pending > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-amber-300">
                <Clock className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  {statusCounts.pending} Pending Review
                </span>
              </div>
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

      {/* Search, Filter Tabs & Sort Controls */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {statusTabs.map((tab) => {
            const isSelected = currentStatus === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => updateFilters({ status: tab.id, page: null })}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold shadow-xs"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-200 font-bold"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-500" aria-hidden="true" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by client email or phone..."
              className="w-full rounded-lg border border-zinc-700/80 bg-zinc-950/70 py-2 pr-4 pl-9 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Filter className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
              <span>Sort:</span>
            </div>
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sortBy: e.target.value, page: null })}
              className="rounded-lg border border-zinc-700/80 bg-zinc-950/70 py-2 pr-8 pl-2.5 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="newest">Newest Submitted</option>
              <option value="oldest">Oldest Submitted</option>
              <option value="requested_date_asc">Meeting Date (Soonest)</option>
              <option value="requested_date_desc">Meeting Date (Furthest)</option>
            </select>

            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  router.push("/dashboard/bookings");
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

      {/* Bookings Table & List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 mb-3">
              <CalendarClock className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">
              {isFiltersActive ? "No matching bookings found" : "No booking requests yet"}
            </h3>
            <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed">
              {isFiltersActive
                ? "Try adjusting your search keywords or switching status filters."
                : "Book a Call requests submitted on dezprox.com will appear here automatically."}
            </p>
            {isFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  router.push("/dashboard/bookings");
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
                  <th className="py-3.5 pl-6 pr-4">Client Contact</th>
                  <th className="py-3.5 px-4">Requested Schedule</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Client Notes</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Submitted</th>
                  <th className="py-3.5 pr-6 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {bookings.map((booking) => {
                  const status = formatStatusBadge(booking.status);
                  const isSelected = selectedBooking?.id === booking.id;

                  return (
                    <tr
                      key={booking.id}
                      className={`transition-colors hover:bg-zinc-800/30 ${
                        isSelected ? "bg-zinc-800/40" : ""
                      }`}
                    >
                      {/* Client Contact */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="font-semibold text-white">{booking.email}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 font-mono text-zinc-400">
                          <Phone className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                          <span>{booking.phone}</span>
                        </div>
                      </td>

                      {/* Requested Schedule */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-zinc-200">
                          {formatDateOnly(booking.requested_date)}
                        </div>
                        <div className="mt-0.5 text-zinc-400">
                          {booking.requested_time_slot}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                        {booking.confirmed_by_founder && (
                          <div className="mt-1 text-[10px] text-zinc-500 truncate max-w-[120px]" title={`Confirmed by ${booking.confirmed_by_founder.full_name}`}>
                            by {booking.confirmed_by_founder.full_name}
                          </div>
                        )}
                      </td>

                      {/* Client Notes Preview */}
                      <td className="py-4 px-4 hidden md:table-cell max-w-xs">
                        {booking.notes ? (
                          <span className="line-clamp-2 text-zinc-400">
                            {booking.notes}
                          </span>
                        ) : (
                          <span className="italic text-zinc-600">No notes provided</span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 px-4 hidden lg:table-cell whitespace-nowrap font-mono text-zinc-500">
                        {formatDateTime(booking.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(booking)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-emerald-500/50 hover:bg-emerald-950/30 hover:text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
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
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800/80 bg-zinc-950/40 px-6 py-4 sm:flex-row">
            <div className="text-xs text-zinc-400">
              Showing{" "}
              <span className="font-semibold text-zinc-200">
                {(page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-zinc-200">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-zinc-200">{totalCount}</span>{" "}
              bookings
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>

              <span className="px-2 text-xs font-medium text-zinc-400">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details & Status Management Panel (Drawer / Modal) */}
      {selectedBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs"
        >
          <div className="relative flex h-full w-full max-w-xl flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <CalendarClock className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                <div>
                  <h2
                    id="booking-detail-title"
                    className="text-base font-bold text-white"
                  >
                    Booking Details
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-500">
                    ID: {selectedBooking.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetails}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
                  className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>Booking status and notes updated successfully!</span>
                </div>
              )}

              {updateState.error && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  <span>{updateState.error}</span>
                </div>
              )}

              {/* Client Information */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Client Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] text-zinc-500">Email Address</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <a
                        href={`mailto:${selectedBooking.email}`}
                        className="text-xs font-semibold text-emerald-400 hover:underline"
                      >
                        {selectedBooking.email}
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-500">Phone Number</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <a
                        href={`tel:${selectedBooking.phone}`}
                        className="text-xs font-mono font-semibold text-zinc-200 hover:underline"
                      >
                        {selectedBooking.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Meeting Schedule
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] text-zinc-500">Requested Date</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-white">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <span>{formatDateOnly(selectedBooking.requested_date)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-zinc-500">Time Slot</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-white">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                      <span>{selectedBooking.requested_time_slot}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-500">Client Message / Notes</div>
                  <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedBooking.notes || "No additional notes provided by client."}
                  </div>
                </div>
              </div>

              {/* Status Update & Internal Notes Form */}
              <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Management & Status Control
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-zinc-400">Current:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-medium ${
                          formatStatusBadge(selectedBooking.status).badgeClass
                        }`}
                      >
                        {formatStatusBadge(selectedBooking.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label
                      htmlFor="update-status"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Update Booking Status
                    </label>
                    <select
                      id="update-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as BookingStatus)}
                      disabled={isUpdating}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      {VALID_BOOKING_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Internal Notes Textarea */}
                  <div>
                    <label
                      htmlFor="internal-notes"
                      className="block text-xs font-medium text-zinc-300 mb-1.5"
                    >
                      Internal Notes (Founder Eyes Only)
                    </label>
                    <textarea
                      id="internal-notes"
                      rows={4}
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      disabled={isUpdating}
                      placeholder="Add private founder notes, call outcomes, or preparation links..."
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Confirmation Metadata (if already confirmed) */}
                  {selectedBooking.confirmed_by_founder && (
                    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-[11px] text-zinc-400">
                      <User className="h-3.5 w-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
                      <div>
                        Confirmed by{" "}
                        <span className="font-semibold text-zinc-200">
                          {selectedBooking.confirmed_by_founder.full_name}
                        </span>
                        {selectedBooking.confirmed_at && (
                          <span> on {formatDateTime(selectedBooking.confirmed_at)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Updating Booking...</span>
                        </>
                      ) : (
                        <span>Save Status & Notes</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Audit Timestamps */}
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3 text-[11px] text-zinc-500 space-y-1">
                <div>Submitted: {formatDateTime(selectedBooking.created_at)}</div>
                <div>Last Updated: {formatDateTime(selectedBooking.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
