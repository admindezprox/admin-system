import type { Metadata } from "next";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { logoutAction } from "@/lib/auth/actions";
import { DashboardNav, MobileDashboardNav } from "./nav";
import { NavProgressProvider } from "@/components/ui/nav-progress";

export const metadata: Metadata = {
  title: "Dezprox Founder Admin",
  description: "Internal founder administration panel",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative server-side verification before rendering ANY protected content.
  // Memoized per-request to avoid redundant network/database roundtrips.
  const { founder } = await requireActiveFounder();

  return (
    <NavProgressProvider>
      <div className="flex min-h-screen flex-col bg-zinc-50/60 text-zinc-900">
        {/* Top Admin Header - Full Width Sticky */}
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
          <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            {/* Brand & Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-zinc-900 text-sm">DEZPROX</span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-600 border border-zinc-200/60">
                    Founder Panel
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">Internal Management System</p>
              </div>
            </div>

            {/* Verified Founder Profile & Logout */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600">
                  <User className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-zinc-900">
                    {founder.fullName}
                  </div>
                  <div className="text-[11px] text-zinc-500">{founder.email}</div>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800">
                  {founder.role.replace("_", " ")}
                </span>
              </div>

              {/* Logout Control */}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  title="Sign out of founder panel"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>

          {/* Mobile / Tablet Horizontal Navigation Bar */}
          <div className="border-t border-zinc-200/80 bg-zinc-50/80 px-4 lg:hidden">
            <MobileDashboardNav />
          </div>
        </header>

        {/* Main Container with Fixed Sidebar + Full-Width Flexible Content */}
        <div className="flex w-full flex-1 items-start">
          {/* Desktop Sidebar Navigation - Fixed 16rem, full viewport height, independent scroll */}
          <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-zinc-200/80 bg-white/70 p-5 lg:flex">
            <div>
              <DashboardNav />
            </div>

            <div className="mt-8 rounded-xl border border-zinc-200/80 bg-white p-3.5 text-xs text-zinc-600 shadow-2xs">
              <div className="font-semibold text-zinc-800 mb-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Session Verified
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Active role: <span className="text-emerald-700 font-medium font-mono">{founder.role}</span>
              </p>
            </div>
          </aside>

          {/* Dynamic Page Content - Flexibly spans 100% of available desktop width */}
          <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:py-8 lg:px-8 xl:px-10">
            {children}
          </main>
        </div>

        {/* Minimal Footer */}
        <footer className="border-t border-zinc-200 bg-white py-4 text-center text-xs text-zinc-400">
          Dezprox Internal Administration · Authorized Access Only
        </footer>
      </div>
    </NavProgressProvider>
  );
}
