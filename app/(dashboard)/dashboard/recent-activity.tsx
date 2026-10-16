"use client";

import { useState } from "react";
import {
  CalendarClock,
  MessageSquare,
  Briefcase,
  Inbox,
  AlertCircle,
  Layers,
} from "lucide-react";
import type {
  RecentBookingRow,
  RecentContactRow,
  RecentServiceRow,
  RecentConsentRow,
} from "@/lib/dashboard/queries";
import {
  formatStatusBadge,
  formatServiceCategory,
  formatBudgetTier,
  formatDateTime,
  formatDateOnly,
  buildUnifiedActivity,
  type ActivityItem,
} from "@/lib/dashboard/formatters";

interface RecentActivityProps {
  recentBookings: { data: RecentBookingRow[]; error: string | null };
  recentContacts: { data: RecentContactRow[]; error: string | null };
  recentServices: { data: RecentServiceRow[]; error: string | null };
  recentConsents: { data: RecentConsentRow[]; error: string | null };
}

type TabType = "all" | "bookings" | "contacts" | "services" | "consents";

export function RecentActivity({
  recentBookings,
  recentContacts,
  recentServices,
  recentConsents,
}: RecentActivityProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const unifiedActivity: ActivityItem[] = buildUnifiedActivity({
    bookings: recentBookings.data,
    contacts: recentContacts.data,
    services: recentServices.data,
  });

  const tabs: Array<{ id: TabType; label: string; count: number; hasError: boolean }> = [
    {
      id: "all",
      label: "All Submissions",
      count: unifiedActivity.length,
      hasError: !!(recentBookings.error || recentContacts.error || recentServices.error),
    },
    {
      id: "bookings",
      label: "Bookings",
      count: recentBookings.data.length,
      hasError: !!recentBookings.error,
    },
    {
      id: "contacts",
      label: "Contacts",
      count: recentContacts.data.length,
      hasError: !!recentContacts.error,
    },
    {
      id: "services",
      label: "Services",
      count: recentServices.data.length,
      hasError: !!recentServices.error,
    },
    {
      id: "consents",
      label: "Consent Audit",
      count: recentConsents.data.length,
      hasError: !!recentConsents.error,
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl backdrop-blur-xs">
      {/* Header and Filter Tabs */}
      <div className="border-b border-zinc-800/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <h2 className="text-lg font-bold text-white">Recent Activity & Submissions</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Real-time records from public website submissions across all enquiry channels.
            </p>
          </div>

          {/* Tab Selector */}
          <div
            role="tablist"
            aria-label="Activity Categories"
            className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-1"
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                    isSelected
                      ? "bg-zinc-800 text-white shadow-xs font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.hasError ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-950 text-[10px] text-red-400 font-bold" title="Query error">
                      !
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                          : "bg-zinc-800/80 text-zinc-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-5 sm:p-6">
        {/* ALL ACTIVITY TAB */}
        {activeTab === "all" && (
          <div role="tabpanel" className="space-y-4">
            {unifiedActivity.length === 0 ? (
              <EmptyState
                title="No submissions recorded yet"
                description="Submissions from the public website (call bookings, contact requests, and project enquiries) will appear here in chronological order."
              />
            ) : (
              <div className="space-y-3">
                {unifiedActivity.map((item) => {
                  const status = formatStatusBadge(item.status);
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700/80 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300">
                          {item.type === "booking" && (
                            <CalendarClock className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                          )}
                          {item.type === "contact" && (
                            <MessageSquare className="h-4 w-4 text-sky-400" aria-hidden="true" />
                          )}
                          {item.type === "service" && (
                            <Briefcase className="h-4 w-4 text-purple-400" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-white">
                              {item.contactName}
                            </span>
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                              {item.typeLabel}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-400 line-clamp-1">
                            {item.detail}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                            <span>{item.contactEmail}</span>
                            {item.phone && <span>· {item.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div role="tabpanel">
            {recentBookings.error ? (
              <ErrorState title="Failed to query booking requests" error={recentBookings.error} />
            ) : recentBookings.data.length === 0 ? (
              <EmptyState
                title="No booking requests yet"
                description="When visitors schedule a consultation call on dezprox.com, their requested time slot and contact details will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3 font-semibold">Contact Email</th>
                      <th className="pb-3 font-semibold">Phone</th>
                      <th className="pb-3 font-semibold">Requested Schedule</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {recentBookings.data.map((b) => {
                      const status = formatStatusBadge(b.status);
                      return (
                        <tr key={b.id} className="hover:bg-zinc-800/20">
                          <td className="py-3.5 pr-4 font-medium text-white">{b.email}</td>
                          <td className="py-3.5 pr-4 font-mono text-zinc-400">{b.phone}</td>
                          <td className="py-3.5 pr-4">
                            <span className="font-semibold text-zinc-200">
                              {formatDateOnly(b.requested_date)}
                            </span>{" "}
                            <span className="text-zinc-400">({b.requested_time_slot})</span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono text-zinc-500">
                            {formatDateTime(b.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONTACT ENQUIRIES TAB */}
        {activeTab === "contacts" && (
          <div role="tabpanel">
            {recentContacts.error ? (
              <ErrorState title="Failed to query contact enquiries" error={recentContacts.error} />
            ) : recentContacts.data.length === 0 ? (
              <EmptyState
                title="No contact enquiries yet"
                description="Messages submitted via the contact form on dezprox.com will be listed here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3 font-semibold">Full Name</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {recentContacts.data.map((c) => {
                      const status = formatStatusBadge(c.status);
                      return (
                        <tr key={c.id} className="hover:bg-zinc-800/20">
                          <td className="py-3.5 pr-4 font-medium text-white">{c.full_name}</td>
                          <td className="py-3.5 pr-4 text-zinc-400">{c.email}</td>
                          <td className="py-3.5 pr-4 text-zinc-300 max-w-xs truncate">
                            {c.subject?.trim() || "General Enquiry"}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono text-zinc-500">
                            {formatDateTime(c.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SERVICE ENQUIRIES TAB */}
        {activeTab === "services" && (
          <div role="tabpanel">
            {recentServices.error ? (
              <ErrorState title="Failed to query service enquiries" error={recentServices.error} />
            ) : recentServices.data.length === 0 ? (
              <EmptyState
                title="No service enquiries yet"
                description="Project and pricing enquiries submitted by prospective clients will be listed here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3 font-semibold">Prospect</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Service Category</th>
                      <th className="pb-3 font-semibold">Budget Tier</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {recentServices.data.map((s) => {
                      const status = formatStatusBadge(s.status);
                      return (
                        <tr key={s.id} className="hover:bg-zinc-800/20">
                          <td className="py-3.5 pr-4 font-medium text-white">{s.full_name}</td>
                          <td className="py-3.5 pr-4 text-zinc-400">{s.email}</td>
                          <td className="py-3.5 pr-4 text-zinc-200">
                            {formatServiceCategory(s.service_category)}
                          </td>
                          <td className="py-3.5 pr-4 text-zinc-400">
                            {formatBudgetTier(s.budget_tier)}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono text-zinc-500">
                            {formatDateTime(s.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONSENT AUDIT TAB */}
        {activeTab === "consents" && (
          <div role="tabpanel">
            {recentConsents.error ? (
              <ErrorState title="Failed to query cookie consent records" error={recentConsents.error} />
            ) : recentConsents.data.length === 0 ? (
              <EmptyState
                title="No consent records yet"
                description="Privacy-compliant cookie consent logs from website visitors will appear here for audit and compliance purposes."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="pb-3 font-semibold">Anonymous Session</th>
                      <th className="pb-3 font-semibold">Version</th>
                      <th className="pb-3 font-semibold">Essential</th>
                      <th className="pb-3 font-semibold">Analytics</th>
                      <th className="pb-3 font-semibold">Marketing</th>
                      <th className="pb-3 font-semibold">Device</th>
                      <th className="pb-3 font-semibold text-right">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-mono">
                    {recentConsents.data.map((c) => {
                      const maskedSession =
                        c.anonymous_session_id.length > 12
                          ? `${c.anonymous_session_id.slice(0, 8)}...`
                          : c.anonymous_session_id;

                      return (
                        <tr key={c.id} className="hover:bg-zinc-800/20">
                          <td className="py-3.5 pr-4 text-zinc-300">{maskedSession}</td>
                          <td className="py-3.5 pr-4 text-zinc-400">v{c.consent_version}</td>
                          <td className="py-3.5 pr-4">
                            <span className="text-emerald-400 font-sans font-medium">Active</span>
                          </td>
                          <td className="py-3.5 pr-4">
                            {c.analytics ? (
                              <span className="text-emerald-400 font-sans font-medium">Granted</span>
                            ) : (
                              <span className="text-zinc-500 font-sans">Declined</span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4">
                            {c.marketing ? (
                              <span className="text-emerald-400 font-sans font-medium">Granted</span>
                            ) : (
                              <span className="text-zinc-500 font-sans">Declined</span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 font-sans capitalize text-zinc-300">
                            {c.user_agent_category || "Unknown"}
                          </td>
                          <td className="py-3.5 text-right text-zinc-500">
                            {formatDateTime(c.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/20 py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-500 mb-3">
        <Inbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function ErrorState({ title, error }: { title: string; error: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-300">
      <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
      <div>
        <h3 className="text-xs font-semibold text-red-200">{title}</h3>
        <p className="mt-0.5 text-xs text-red-400/90 font-mono">{error}</p>
      </div>
    </div>
  );
}
