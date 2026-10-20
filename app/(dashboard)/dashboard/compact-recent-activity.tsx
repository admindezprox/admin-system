"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  MessageSquare,
  Briefcase,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import type {
  RecentBookingRow,
  RecentContactRow,
  RecentServiceRow,
} from "@/lib/dashboard/queries";
import {
  formatStatusBadge,
  formatDateTime,
  buildUnifiedActivity,
  type ActivityItem,
} from "@/lib/dashboard/formatters";

interface CompactRecentActivityProps {
  recentBookings: { data: RecentBookingRow[]; error: string | null };
  recentContacts: { data: RecentContactRow[]; error: string | null };
  recentServices: { data: RecentServiceRow[]; error: string | null };
}

type FilterTab = "all" | "bookings" | "contacts" | "services";

export function CompactRecentActivity({
  recentBookings,
  recentContacts,
  recentServices,
}: CompactRecentActivityProps) {
  const [tab, setTab] = useState<FilterTab>("all");

  const unifiedActivity: ActivityItem[] = buildUnifiedActivity({
    bookings: recentBookings.data,
    contacts: recentContacts.data,
    services: recentServices.data,
  });

  const filteredItems = unifiedActivity.filter((item) => {
    if (tab === "bookings") return item.type === "booking";
    if (tab === "contacts") return item.type === "contact";
    if (tab === "services") return item.type === "service";
    return true;
  }).slice(0, 5); // Limit strictly to latest 5 items for compact operational scan

  const viewAllHref =
    tab === "bookings"
      ? "/dashboard/bookings"
      : tab === "contacts"
      ? "/dashboard/contact-enquiries"
      : tab === "services"
      ? "/dashboard/service-enquiries"
      : "/dashboard/bookings";

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs">
      {/* Header with Title, Tabs, and View All Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
              Latest Submissions
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            Top 5 recent customer enquiries across all intake channels.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                tab === "all"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTab("bookings")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                tab === "bookings"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Bookings
            </button>
            <button
              type="button"
              onClick={() => setTab("contacts")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                tab === "contacts"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Contacts
            </button>
            <button
              type="button"
              onClick={() => setTab("services")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                tab === "services"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold border border-zinc-200/80"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Projects
            </button>
          </div>

          {/* View All Module Link */}
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-colors shadow-2xs shrink-0"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Compact Rows List */}
      <div className="mt-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
            <p className="text-xs">No recent submissions found for this filter</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredItems.map((item) => {
              const status = formatStatusBadge(item.status);
              const targetUrl =
                item.type === "booking"
                  ? `/dashboard/bookings?id=${item.id}`
                  : item.type === "contact"
                  ? `/dashboard/contact-enquiries?id=${item.id}`
                  : `/dashboard/service-enquiries?id=${item.id}`;

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={targetUrl}
                  className="group flex flex-col gap-2.5 py-3 px-2 transition-colors hover:bg-zinc-50/80 rounded-lg sm:flex-row sm:items-center sm:justify-between"
                  title={`Open detail in ${item.typeLabel}`}
                >
                  {/* Left: Icon, Name/Email & Channel badge */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-600 group-hover:bg-white transition-colors">
                      {item.type === "booking" && (
                        <CalendarClock className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                      )}
                      {item.type === "contact" && (
                        <MessageSquare className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                      )}
                      {item.type === "service" && (
                        <Briefcase className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-900 group-hover:text-emerald-800 transition-colors truncate max-w-[200px]">
                        {item.contactName || item.contactEmail}
                      </span>
                      <span className="rounded bg-zinc-100 border border-zinc-200/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                        {item.typeLabel}
                      </span>
                      <span className="hidden md:inline text-xs text-zinc-400 font-mono truncate max-w-[220px]">
                        {item.contactEmail}
                      </span>
                    </div>
                  </div>

                  {/* Right: Date, Status Badge & Arrow */}
                  <div className="flex items-center justify-between gap-3 shrink-0 sm:justify-end">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {formatDateTime(item.createdAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${status.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:text-emerald-700 transition-all shrink-0" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
