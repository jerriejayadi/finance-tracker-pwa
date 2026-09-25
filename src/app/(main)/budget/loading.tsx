import { Skeleton } from "@/components/ui/skeleton";

// Budget skeleton, shown instantly while the page's RSC payload loads.
export default function Loading() {
  return (
    <main className="flex flex-col gap-4 pb-4" role="status" aria-busy="true">
      {/* Month stepper header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <Skeleton className="h-7 w-28 rounded-full" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Hero: donut + totals */}
      <div className="bg-bg-1 border-line mx-4 flex items-center gap-4 rounded-lg border p-5">
        <Skeleton className="h-[140px] w-[140px] flex-shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Pace strip */}
      <div className="bg-bg-1 border-line mx-4 grid grid-cols-2 items-center rounded-md border py-3.5">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-1.5 px-4">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Section title */}
      <div className="mt-2 flex items-center justify-between px-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-24 rounded-sm" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-hidden px-5 pb-1">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Category list */}
      <div className="flex flex-col gap-1 px-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-1 border-line rounded-lg border p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
