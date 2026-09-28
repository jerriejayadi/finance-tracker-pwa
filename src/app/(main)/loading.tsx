import { DashboardSkeleton } from "@/components/home/dashboard-skeleton";

// Dashboard skeleton, shown instantly while the page's RSC payload loads.
export default function Loading() {
  return <DashboardSkeleton />;
}
