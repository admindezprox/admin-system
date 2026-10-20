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
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500",
      };
    case "new":
      return {
        label: "New",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-600",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClass: "bg-emerald-600",
      };
    case "contacted":
    case "in_review":
      return {
        label: normalized === "in_review" ? "In Review" : "Contacted",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
        dotClass: "bg-blue-600",
      };
    case "discovery_scheduled":
      return {
        label: "Discovery Scheduled",
        badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
        dotClass: "bg-cyan-600",
      };
    case "proposal_sent":
      return {
        label: "Proposal Sent",
        badgeClass: "border-purple-200 bg-purple-50 text-purple-800",
        dotClass: "bg-purple-600",
      };
    case "closed_won":
      return {
        label: "Closed Won",
        badgeClass: "border-emerald-300 bg-emerald-100 text-emerald-900",
        dotClass: "bg-emerald-600",
      };
    case "closed_lost":
    case "cancelled":
    case "spam":
      return {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        badgeClass: "border-red-200 bg-red-50 text-red-800",
        dotClass: "bg-red-500",
      };
    case "rescheduled":
      return {
        label: "Rescheduled",
        badgeClass: "border-yellow-200 bg-yellow-50 text-yellow-800",
        dotClass: "bg-yellow-600",
      };
    case "completed":
    case "responded":
    case "archived":
      return {
        label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        badgeClass: "border-zinc-200 bg-zinc-100 text-zinc-700",
        dotClass: "bg-zinc-500",
      };
    default:
      return {
        label: status,
        badgeClass: "border-zinc-200 bg-zinc-50 text-zinc-700",
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
