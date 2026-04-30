export default function DashboardLoading() {
  return (
    <div>
      {/* Title skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-48 bg-chip rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-chip rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-chip rounded-lg animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-chip border border-hair rounded-xl overflow-hidden">
            <div className="aspect-square bg-chip animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 bg-chip rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-chip rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
