import { Skeleton } from "@/components/ui/skeleton";

// Mirrors TransactionItem / HistoryList row dimensions.
export function TransactionItemSkeleton() {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex min-w-0 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-3.5 w-16" />
    </div>
  );
}
