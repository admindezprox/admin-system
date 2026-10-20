import Link from "next/link";
import {
  CalendarClock,
  Clock,
  MessageSquare,
  Briefcase,
  Cookie,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DashboardSummaryData } from "@/lib/dashboard/queries";

interface SummaryCardsProps {
  metrics: DashboardSummaryData["metrics"];
  trends?: DashboardSummaryData["analytics"]["trends"];
}

export function SummaryCards({ metrics, trends }: SummaryCardsProps) {
  const cards = [
    {
      title: "Booking Requests",
      primaryCount: metrics.totalBookings.count,
      primaryError: metrics.totalBookings.error,
      secondaryCount: metrics.pendingBookings.count,
      secondaryError: metrics.pendingBookings.error,
      secondaryLabel: "pending confirmation",
      trend: trends?.bookings,
      icon: CalendarClock,
      accentColor: "emerald",
      href: "/dashboard/bookings",
      moduleNote: "Open Bookings",
    },
    {
      title: "Actionable Calls",
      primaryCount: metrics.pendingBookings.count,
      primaryError: metrics.pendingBookings.error,
      subtitle: "Pending founder review",
      icon: Clock,
      accentColor: "amber",
      isHighlight: true,
      href: "/dashboard/bookings?status=pending",
      moduleNote: "Review Pending",
    },
    {
      title: "Contact Enquiries",
      primaryCount: metrics.totalContactEnquiries.count,
      primaryError: metrics.totalContactEnquiries.error,
      secondaryCount: metrics.newContactEnquiries.count,
      secondaryError: metrics.newContactEnquiries.error,
      secondaryLabel: "new unread",
      trend: trends?.contacts,
      icon: MessageSquare,
      accentColor: "sky",
      href: "/dashboard/contact-enquiries",
      moduleNote: "Open Enquiries",
    },
    {
      title: "Project Enquiries",
      primaryCount: metrics.totalServiceEnquiries.count,
      primaryError: metrics.totalServiceEnquiries.error,
      secondaryCount: metrics.newServiceEnquiries.count,
      secondaryError: metrics.newServiceEnquiries.error,
      secondaryLabel: "new leads",
      trend: trends?.services,
      icon: Briefcase,
      accentColor: "purple",
      href: "/dashboard/service-enquiries",
      moduleNote: "Open Projects",
    },
    {
      title: "Consent Logs",
      primaryCount: metrics.totalCookieConsents.count,
      primaryError: metrics.totalCookieConsents.error,
      subtitle: "Privacy-compliant records",
      trend: trends?.consents,
      icon: Cookie,
      accentColor: "zinc",
      href: "/dashboard/consent-tracking",
      moduleNote: "Open Tracking",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasError = card.primaryError !== null;

        return (
          <div
            key={card.title}
            className={`relative flex flex-col justify-between min-w-0 rounded-xl border p-4 sm:p-5 transition-all duration-150 shadow-xs hover:shadow-sm ${
              card.isHighlight
                ? "border-amber-300 bg-amber-50/30 hover:border-amber-400"
                : "border-zinc-200/80 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="min-w-0">
              {/* Header: Title and Icon */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 truncate" title={card.title}>
                  {card.title}
                </span>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${
                    card.accentColor === "emerald"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : card.accentColor === "amber"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : card.accentColor === "sky"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : card.accentColor === "purple"
                      ? "border-purple-200 bg-purple-50 text-purple-700"
                      : "border-zinc-200 bg-zinc-50 text-zinc-600"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              {/* Main Metric Value and Trend */}
              <div className="mt-2.5 flex items-baseline justify-between gap-2">
                {hasError ? (
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-semibold">Query Error</span>
                  </div>
                ) : (
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
                    {card.primaryCount !== null
                      ? card.primaryCount.toLocaleString()
                      : "—"}
                  </div>
                )}

                {/* Grounded Real-Data Trend Indicator */}
                {!hasError && card.trend?.hasData && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold font-mono shrink-0 ${
                      card.trend.isPositive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                    }`}
                    title={card.trend.label}
                  >
                    {card.trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-zinc-500" aria-hidden="true" />
                    )}
                    <span>{card.trend.label}</span>
                  </span>
                )}
              </div>

              {/* Sub-Metric / Status Description */}
              <div className="mt-1 text-xs">
                {hasError ? (
                  <p className="text-[11px] text-rose-600/80 truncate" title={card.primaryError || ""}>
                    {card.primaryError}
                  </p>
                ) : card.subtitle ? (
                  <p className="text-zinc-500 truncate">{card.subtitle}</p>
                ) : card.secondaryCount !== undefined && card.secondaryCount !== null ? (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        card.secondaryCount > 0 ? "bg-amber-500" : "bg-zinc-300"
                      }`}
                    />
                    <span className="font-semibold text-zinc-800 font-mono">
                      {card.secondaryCount}
                    </span>
                    <span className="truncate">{card.secondaryLabel}</span>
                  </div>
                ) : (
                  <span className="text-zinc-400">Live database</span>
                )}
              </div>
            </div>

            {/* Card Footer: Module Link / Note */}
            {card.href ? (
              <Link
                href={card.href}
                className="group mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <span>{card.moduleNote}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </Link>
            ) : (
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs text-zinc-400">
                <span>{card.moduleNote}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
