import { Skeleton } from "@/components/ui/skeleton";

// Category detail skeleton; also overrides the parent budget skeleton for this route.
export default function Loading() {
  return (
    <main className="flex flex-col gap-4 pb-4" role="status" aria-busy="true">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      {/* Hero */}
      <div className="bg-bg-1 border-line mx-4 flex flex-col gap-3 rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="mt-2 h-7 w-40" />
        <Skeleton className="h-[6px] w-full rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Day groups */}
      {[3, 2].map((rows, g) => (
        <div key={g} className="flex flex-col gap-1.5 px-4">
          <Skeleton className="mx-1 h-3 w-20" />
          <div className="bg-bg-1 border-line flex flex-col gap-4 rounded-lg border px-3.5 py-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
