"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  MessageSquare,
  Briefcase,
  Cookie,
  Lock,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  isImplemented: boolean;
  phaseLabel?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isImplemented: true,
  },
  {
    name: "Booking Requests",
    href: "/dashboard/bookings",
    icon: CalendarClock,
    isImplemented: true,
  },
  {
    name: "Contact Enquiries",
    href: "/dashboard/contact-enquiries",
    icon: MessageSquare,
    isImplemented: true,
  },
  {
    name: "Service & Project Enquiries",
    href: "/dashboard/service-enquiries",
    icon: Briefcase,
    isImplemented: true,
  },
  {
    name: "Consent Tracking",
    href: "/dashboard/consent-tracking",
    icon: Cookie,
    isImplemented: true,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5" aria-label="Dashboard navigation">
      <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
        Management Modules
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.isImplemented && pathname === item.href;

        if (!item.isImplemented) {
          return (
            <div
              key={item.name}
              className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-500 cursor-not-allowed select-none transition-colors"
              title={`${item.name} is scheduled for ${item.phaseLabel}`}
              aria-disabled="true"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden="true" />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="flex items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{item.phaseLabel}</span>
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 font-semibold shadow-xs border border-emerald-500/20"
                : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? "text-emerald-400" : "text-zinc-400"
              }`}
              aria-hidden="true"
            />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
      aria-label="Mobile module navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.isImplemented && pathname === item.href;

        if (!item.isImplemented) {
          return (
            <div
              key={item.name}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-not-allowed select-none"
              title={`${item.name} is scheduled for ${item.phaseLabel}`}
              aria-disabled="true"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
              <span>{item.name}</span>
              <span className="text-[10px] text-zinc-600">({item.phaseLabel})</span>
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
                : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
