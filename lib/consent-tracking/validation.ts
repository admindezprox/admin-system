/**
 * Consent Tracking Input Validation and Sanitization
 *
 * Strict server-side validation for cookie consent audit filters,
 * device categories, search terms, and pagination parameters.
 */

import type { UserAgentCategory } from "@/lib/supabase/types";

export const VALID_USER_AGENT_CATEGORIES: readonly UserAgentCategory[] = [
  "desktop",
  "mobile",
  "tablet",
  "bot",
  "unknown",
] as const;

export const VALID_CONSENT_DECISIONS = [
  "all",
  "full",
  "essential_only",
  "analytics",
  "marketing",
] as const;

export type ConsentDecisionFilter = (typeof VALID_CONSENT_DECISIONS)[number];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

export function isValidUserAgentCategory(
  category: unknown
): category is UserAgentCategory {
  if (typeof category !== "string") return false;
  return (VALID_USER_AGENT_CATEGORIES as readonly string[]).includes(
    category.trim().toLowerCase()
  );
}

export function isValidConsentDecision(
  decision: unknown
): decision is ConsentDecisionFilter {
  if (typeof decision !== "string") return false;
  return (VALID_CONSENT_DECISIONS as readonly string[]).includes(
    decision.trim().toLowerCase()
  );
}

export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== "string") return "";
  // Strip control characters, excessive whitespace, and SQL/PostgREST injection tokens
  return query
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[%_,()]/g, " ")
    .trim()
    .slice(0, 100);
}

export interface PaginationParams {
  page?: unknown;
  pageSize?: unknown;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  from: number;
  to: number;
  calculateTotalPages: (totalCount: number) => number;
}

export function calculatePagination(params: PaginationParams = {}): PaginationResult {
  const defaultSize = params.defaultPageSize ?? 10;
  const maxSize = params.maxPageSize ?? 50;

  const pageNum = Number(params.page);
  const sizeNum = Number(params.pageSize);

  const page = Math.max(1, Math.floor(isNaN(pageNum) || pageNum < 1 ? 1 : pageNum));
  const pageSize = Math.min(
    maxSize,
    Math.max(1, Math.floor(isNaN(sizeNum) || sizeNum < 1 ? defaultSize : sizeNum))
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return {
    page,
    pageSize,
    from,
    to,
    calculateTotalPages: (totalCount: number) =>
      Math.max(1, Math.ceil(Math.max(0, totalCount) / pageSize)),
  };
}
