import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fadeIn" aria-live="polite" aria-busy="true">
      <PageHeaderSkeleton />
      <TableSkeleton rows={7} cols={5} />
    </div>
  );
}
