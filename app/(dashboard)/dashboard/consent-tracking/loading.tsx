import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function ConsentTrackingLoading() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-zinc-200/60 animate-pulse" />
        ))}
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
