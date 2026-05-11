/**
 * Dashboard loading skeleton.
 * Shows while the server component fetches data.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header skeleton */}
      <div className="bg-paper border-b border-hairline">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse" />
          <div className="h-4 w-32 bg-hairline rounded-sm animate-pulse" />
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Total skeleton */}
        <div className="mb-8">
          <div className="h-3 w-20 bg-hairline rounded-sm animate-pulse mb-2" />
          <div className="h-16 w-48 bg-hairline rounded-sm animate-pulse" />

          <div className="my-6 border-t border-hairline" />

          {/* Category breakdown skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-3 w-14 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-20 bg-hairline rounded-sm animate-pulse" />
                <div className="h-1 bg-hairline rounded-sm animate-pulse" />
                <div className="h-3 w-8 bg-hairline rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-hairline mb-6" />

        {/* List skeleton */}
        <div className="flex flex-col">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="py-3 border-b border-hairline flex items-center gap-4"
            >
              <div className="h-4 w-10 bg-hairline rounded-sm animate-pulse shrink-0" />
              <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse shrink-0" />
              <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse shrink-0" />
              <div className="h-4 flex-1 bg-hairline rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
