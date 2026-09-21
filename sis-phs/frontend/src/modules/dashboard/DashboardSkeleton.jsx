export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-3">
          <div className="h-8 w-48 sm:w-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-4 w-72 sm:w-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 sm:w-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Two Columns Layout Skeleton */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-56 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="space-y-3 mt-6">
             {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 w-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"></div>
             ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-6 space-y-2">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-3">
           <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/80 rounded-lg"></div>
           {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800"></div>
           ))}
        </div>
      </div>
    </div>
  )
}
