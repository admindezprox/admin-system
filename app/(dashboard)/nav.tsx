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
import { useNavProgress } from "@/components/ui/nav-progress";

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
  const { pendingHref, setPendingHref, startNavTransition } = useNavProgress();

  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
      <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
        Management Modules
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        // Immediate UI feedback: if user clicked this item, it highlights instantly
        const isActive =
          item.isImplemented &&
          (pendingHref ? pendingHref === item.href : pathname === item.href);

        if (!item.isImplemented) {
          return (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 cursor-not-allowed select-none transition-colors border border-transparent"
              title={`${item.name} is scheduled for ${item.phaseLabel}`}
              aria-disabled="true"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 text-zinc-300" aria-hidden="true" />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
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
            onClick={() => {
              if (pathname !== item.href) {
                // Immediate response: show selection in < 10ms
                setPendingHref(item.href);
                startNavTransition(() => {});
              }
            }}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              isActive
                ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/90 shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-emerald-700" : "text-zinc-400 group-hover:text-zinc-600"
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
  const { pendingHref, setPendingHref, startNavTransition } = useNavProgress();

  return (
    <nav
      className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none"
      aria-label="Mobile module navigation"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.isImplemented &&
          (pendingHref ? pendingHref === item.href : pathname === item.href);

        if (!item.isImplemented) {
          return (
            <div
              key={item.name}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-400 cursor-not-allowed select-none"
              title={`${item.name} is scheduled for ${item.phaseLabel}`}
              aria-disabled="true"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span>{item.name}</span>
              <span className="text-[10px] text-zinc-400">({item.phaseLabel})</span>
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              if (pathname !== item.href) {
                setPendingHref(item.href);
                startNavTransition(() => {});
              }
            }}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
                isActive ? "text-emerald-700" : "text-zinc-500"
              }`}
              aria-hidden="true"
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
