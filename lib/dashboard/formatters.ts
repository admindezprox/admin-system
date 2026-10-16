/**
 * Dashboard Presentation Formatters and Data Transformers
 *
 * Pure utility functions for converting database records, statuses,
 * and categories into accessible, human-readable representations.
 */

import type { BookingStatus, ContactEnquiryStatus, ServiceCategory, ServiceEnquiryStatus, BudgetTier } from "@/lib/supabase/types";

export interface StatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function formatStatusBadge(status: string): StatusBadgeConfig {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "pending":
      return {
        label: "Pending",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        dotClass: "bg-amber-400",
      };
    case "new":
      return {
        label: "New",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dotClass: "bg-emerald-400",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dotClass: "bg-emerald-400",
      };
    case "contacted":
    case "in_review":
      return {
        label: normalized === "in_review" ? "In Review" : "Contacted",
        badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        dotClass: "bg-blue-400",
      };
    case "discovery_scheduled":
      return {
        label: "Discovery Scheduled",
        badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
        dotClass: "bg-cyan-400",
      };
    case "proposal_sent":
      return {
        label: "Proposal Sent",
        badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400",
        dotClass: "bg-purple-400",
      };
    case "closed_won":
      return {
        label: "Closed Won",
        badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
        dotClass: "bg-emerald-400",
      };
    case "closed_lost":
    case "cancelled":
    case "spam":
      return {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        badgeClass: "border-red-500/30 bg-red-500/10 text-red-400",
        dotClass: "bg-red-400",
      };
    case "rescheduled":
      return {
        label: "Rescheduled",
        badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        dotClass: "bg-yellow-400",
      };
    case "completed":
    case "responded":
    case "archived":
      return {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        badgeClass: "border-zinc-700 bg-zinc-800 text-zinc-300",
        dotClass: "bg-zinc-400",
      };
    default:
      return {
        label: status,
        badgeClass: "border-zinc-700 bg-zinc-800/80 text-zinc-300",
        dotClass: "bg-zinc-400",
      };
  }
}

export function formatServiceCategory(category: ServiceCategory | string): string {
  switch (category) {
    case "custom_software":
      return "Custom Software";
    case "web_development":
      return "Web Development";
    case "ui_ux_design":
      return "UI/UX Design";
    case "mobile_apps":
      return "Mobile Apps";
    case "graphic_design":
      return "Graphic Design";
    case "marketing_growth":
      return "Marketing & Growth";
    case "erp_lms_systems":
      return "ERP & LMS Systems";
    case "other":
      return "General / Other";
    default:
      return category.replace(/_/g, " ");
  }
}

export function formatBudgetTier(tier: BudgetTier | string | null): string {
  if (!tier) return "Not specified";
  switch (tier) {
    case "starter":
      return "Starter Tier";
    case "growth":
      return "Growth Tier";
    case "scale":
      return "Scale Tier";
    case "custom":
      return "Custom Tier";
    default:
      return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export interface ActivityItem {
  id: string;
  type: "booking" | "contact" | "service";
  typeLabel: string;
  contactName: string;
  contactEmail: string;
  phone?: string | null;
  detail: string;
  status: BookingStatus | ContactEnquiryStatus | ServiceEnquiryStatus | string;
  createdAt: string;
  timestamp: number;
}

export function buildUnifiedActivity(params: {
  bookings: Array<{
    id: string;
    email: string;
    phone: string;
    requested_date: string;
    requested_time_slot: string;
    status: BookingStatus;
    created_at: string;
  }>;
  contacts: Array<{
    id: string;
    full_name: string;
    email: string;
    subject: string | null;
    status: ContactEnquiryStatus;
    created_at: string;
  }>;
  services: Array<{
    id: string;
    full_name: string;
    email: string;
    service_category: ServiceCategory;
    budget_tier: BudgetTier | null;
    status: ServiceEnquiryStatus;
    created_at: string;
  }>;
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const b of params.bookings) {
    items.push({
      id: b.id,
      type: "booking",
      typeLabel: "Call Booking",
      contactName: b.email,
      contactEmail: b.email,
      phone: b.phone,
      detail: `Call on ${formatDateOnly(b.requested_date)} at ${b.requested_time_slot}`,
      status: b.status,
      createdAt: b.created_at,
      timestamp: new Date(b.created_at).getTime() || 0,
    });
  }

  for (const c of params.contacts) {
    items.push({
      id: c.id,
      type: "contact",
      typeLabel: "Contact Enquiry",
      contactName: c.full_name,
      contactEmail: c.email,
      detail: c.subject?.trim() || "General Enquiry",
      status: c.status,
      createdAt: c.created_at,
      timestamp: new Date(c.created_at).getTime() || 0,
    });
  }

  for (const s of params.services) {
    const category = formatServiceCategory(s.service_category);
    const budget = s.budget_tier ? ` (${formatBudgetTier(s.budget_tier)})` : "";
    items.push({
      id: s.id,
      type: "service",
      typeLabel: "Project Enquiry",
      contactName: s.full_name,
      contactEmail: s.email,
      detail: `${category}${budget}`,
      status: s.status,
      createdAt: s.created_at,
      timestamp: new Date(s.created_at).getTime() || 0,
    });
  }

  // Sort descending by timestamp
  return items.sort((a, b) => b.timestamp - a.timestamp);
}
