import Link from "next/link";
import {
  CalendarClock,
  Clock,
  MessageSquare,
  Briefcase,
  Cookie,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import type { DashboardSummaryData } from "@/lib/dashboard/queries";

interface SummaryCardsProps {
  metrics: DashboardSummaryData["metrics"];
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  const cards = [
    {
      title: "Booking Requests",
      primaryCount: metrics.totalBookings.count,
      primaryError: metrics.totalBookings.error,
      secondaryCount: metrics.pendingBookings.count,
      secondaryError: metrics.pendingBookings.error,
      secondaryLabel: "pending confirmation",
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
      icon: Cookie,
      accentColor: "zinc",
      href: "/dashboard/consent-tracking",
      moduleNote: "Open Tracking",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const hasError = card.primaryError !== null;

        return (
          <div
            key={card.title}
            className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-md ${
              card.isHighlight
                ? "border-amber-500/40 bg-radial from-amber-950/30 via-zinc-900/90 to-zinc-950"
                : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-700/80"
            }`}
          >
            <div>
              {/* Header: Title and Icon */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {card.title}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    card.accentColor === "emerald"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : card.accentColor === "amber"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : card.accentColor === "sky"
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                      : card.accentColor === "purple"
                      ? "border-purple-500/30 bg-purple-500/10 text-purple-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              {/* Main Metric Value */}
              <div className="mt-4">
                {hasError ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-semibold">Query Error</span>
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold tracking-tight text-white font-mono">
                    {card.primaryCount !== null
                      ? card.primaryCount.toLocaleString()
                      : "—"}
                  </div>
                )}
              </div>

              {/* Sub-Metric / Status Description */}
              <div className="mt-2 text-xs">
                {hasError ? (
                  <p className="text-[11px] text-red-400/80 line-clamp-1" title={card.primaryError || ""}>
                    {card.primaryError}
                  </p>
                ) : card.subtitle ? (
                  <p className="text-zinc-400">{card.subtitle}</p>
                ) : card.secondaryCount !== undefined && card.secondaryCount !== null ? (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        card.secondaryCount > 0 ? "bg-amber-400" : "bg-zinc-600"
                      }`}
                    />
                    <span className="font-semibold text-zinc-200">
                      {card.secondaryCount}
                    </span>
                    <span>{card.secondaryLabel}</span>
                  </div>
                ) : (
                  <span className="text-zinc-500">Live database</span>
                )}
              </div>
            </div>

            {/* Card Footer: Module Link / Note */}
            {card.href ? (
              <Link
                href={card.href}
                className="group mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>{card.moduleNote}</span>
                <ArrowUpRight className="h-3 w-3 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
              </Link>
            ) : (
              <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500">
                <span>{card.moduleNote}</span>
                <ArrowUpRight className="h-3 w-3 text-zinc-600" aria-hidden="true" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
