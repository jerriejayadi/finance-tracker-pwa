import { Skeleton } from "@/components/ui/skeleton";

// Profile skeleton, shown instantly while the page's RSC payload loads.
export default function Loading() {
  return (
    <div className="flex flex-col gap-3.5 pb-8" role="status" aria-busy="true">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Profile card */}
      <div className="bg-bg-1 border-line mx-4 flex items-center gap-4 rounded-lg border p-[22px_20px]">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-9 flex-shrink-0 rounded-full" />
      </div>

      {/* Stats strip */}
      <div className="border-line bg-bg-1 mx-4 grid grid-cols-3 overflow-hidden rounded-md border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-line flex flex-col gap-1.5 border-r p-3.5 last:border-r-0">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>

      {/* Settings groups */}
      <div className="mt-1 flex flex-col gap-3.5 px-4">
        {[3, 2, 3].map((rows, g) => (
          <div key={g} className="flex flex-col">
            {g > 0 && <Skeleton className="mt-1 mb-2 ml-1 h-2.5 w-20" />}
            <div className="bg-bg-1 border-line overflow-hidden rounded-md border">
              {Array.from({ length: rows }).map((_, i) => (
                <div
                  key={i}
                  className="border-line-soft flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0"
                >
                  <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
