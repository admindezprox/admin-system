export default function ConsentTrackingLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading consent records">
      {/* Header Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-zinc-800" />
              <div className="h-6 w-48 rounded-md bg-zinc-800" />
            </div>
            <div className="h-4 w-72 rounded-md bg-zinc-800/60" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-28 rounded-xl bg-zinc-800" />
            <div className="h-9 w-32 rounded-xl bg-zinc-800" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        <div className="h-9 w-20 rounded-xl bg-zinc-800" />
        <div className="h-9 w-28 rounded-xl bg-zinc-800/60" />
        <div className="h-9 w-28 rounded-xl bg-zinc-800/60" />
        <div className="h-9 w-24 rounded-xl bg-zinc-800/60" />
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="h-14 rounded-xl border border-zinc-800 bg-zinc-900/60" />

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-xl space-y-3">
        <div className="h-10 rounded-lg bg-zinc-800/40" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-zinc-800/20" />
        ))}
      </div>
    </div>
  );
}
