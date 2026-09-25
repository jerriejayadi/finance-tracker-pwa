import { Skeleton } from "@/components/ui/skeleton";
import { TransactionItemSkeleton } from "@/components/transactions/transaction-item-skeleton";

// Dashboard skeleton, shown instantly while the page's RSC payload loads.
export default function Loading() {
  return (
    <main className="flex flex-col gap-4" role="status" aria-busy="true">
      {/* Balance hero */}
      <section className="bg-bg-1 border-line mx-4 rounded-lg border p-[22px_22px_20px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-11 w-48" />
        <div className="mt-[18px] grid grid-cols-3 gap-2">
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
        </div>
      </section>

      {/* In/Out strip */}
      <section className="bg-bg-1 border-line mx-4 grid grid-cols-[1fr_1px_1fr] items-center rounded-md border py-3.5">
        <InOutSkeleton />
        <div className="bg-line h-7 w-px" />
        <InOutSkeleton />
      </section>

      {/* Section title */}
      <div className="mt-[18px] flex items-center justify-between px-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Period picker */}
      <div className="px-5">
        <Skeleton className="h-9 w-full rounded-sm" />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-hidden px-5 pb-1">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-0.5 px-4">
        <div className="flex justify-between px-1 pt-3.5 pb-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <TransactionItemSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

function InOutSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3.5">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
