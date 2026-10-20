import {
  PageHeaderSkeleton,
  DashboardMetricsSkeleton,
  AnalyticsChartsSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

export default function MainDashboardLoading() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <PageHeaderSkeleton />
      <DashboardMetricsSkeleton />
      <AnalyticsChartsSkeleton />
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
