import { Skeleton } from "@/components/ui/skeleton";
import { TransactionItemSkeleton } from "@/components/transactions/transaction-item-skeleton";

// History skeleton, shown instantly while the page's RSC payload loads.
export default function Loading() {
  return (
    <main className="flex flex-col gap-3 pb-4" role="status" aria-busy="true">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-1">
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Summary */}
      <div className="bg-bg-1 border-line mx-4 grid grid-cols-3 items-center rounded-md border py-3.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 px-2">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Filter strip */}
      <div className="flex gap-2 overflow-hidden px-4">
        <Skeleton className="h-[30px] w-20 flex-shrink-0 rounded-full" />
        <Skeleton className="h-[30px] w-28 flex-shrink-0 rounded-full" />
        <Skeleton className="h-[30px] w-24 flex-shrink-0 rounded-full" />
      </div>

      {/* Result count + sort */}
      <div className="flex items-center justify-between px-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* List */}
      <div className="flex flex-col gap-px px-3">
        {[0, 1].map((g) => (
          <div key={g} className="flex flex-col">
            <div className="flex justify-between px-2 pt-3.5 pb-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            {[0, 1, 2].map((i) => (
              <TransactionItemSkeleton key={i} />
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
