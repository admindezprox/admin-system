import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-200/70 ${className}`}
    />
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" aria-busy="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs flex flex-col justify-between h-32"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden" aria-busy="true">
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 border-b border-zinc-200/80 bg-zinc-50 px-6 py-3.5">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Table rows skeleton */}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? "w-36" : c === 1 ? "w-48" : "w-20"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}

export function AnalyticsChartsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      {/* Timeline chart skeleton */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-xs h-96 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>

      {/* 2-column charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs h-64 flex flex-col justify-between">
          <Skeleton className="h-5 w-44" />
          <div className="flex items-center justify-center">
            <Skeleton className="h-32 w-32 rounded-full" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs h-64 flex flex-col justify-between">
          <Skeleton className="h-5 w-44" />
          <div className="space-y-4">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
