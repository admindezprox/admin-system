import type { Metadata } from "next";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { requireActiveFounder } from "@/lib/supabase/founder";
import { logoutAction } from "@/lib/auth/actions";
import { DashboardNav, MobileDashboardNav } from "./nav";

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
  // Unauthenticated users are redirected to /login.
  // Inactive or unauthorized users are purged and redirected to /login?error=unauthorized.
  const { founder } = await requireActiveFounder();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/50 shadow-inner">
              <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white">DEZPROX</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
                  Founder Panel
                </span>
              </div>
              <p className="text-xs text-zinc-500">Internal Management System</p>
            </div>
          </div>

          {/* Verified Founder Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300">
                <User className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-zinc-200">
                  {founder.fullName}
                </div>
                <div className="text-[11px] text-zinc-400">{founder.email}</div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                {founder.role.replace("_", " ")}
              </span>
            </div>

            {/* Logout Control */}
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Sign out of founder panel"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Navigation Bar */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/60 px-4 lg:hidden">
          <MobileDashboardNav />
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-start">
        {/* Desktop Sidebar Navigation */}
        <aside className="sticky top-[65px] hidden w-64 shrink-0 border-r border-zinc-800/70 py-6 pr-6 lg:block">
          <DashboardNav />

          <div className="mt-8 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-xs text-zinc-400">
            <div className="font-semibold text-zinc-300 mb-1">Session Verified</div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Authorized under role: <span className="text-emerald-400 font-mono">{founder.role}</span>
            </p>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 min-w-0 py-6 px-4 sm:px-6 lg:py-8 lg:px-8">
          {children}
        </main>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-900 bg-black/40 py-4 text-center text-xs text-zinc-600">
        Dezprox Internal Administration · Authorized Access Only
      </footer>
    </div>
  );
}
