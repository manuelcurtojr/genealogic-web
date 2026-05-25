/**
 * Skeleton loaders — placeholders animados durante lazy loads.
 *
 * Estilo unificado: bg-surface-card con un pulse sutil. Sin shimmer
 * cubista (el pulse simple es más limpio y consume menos GPU).
 */

export function SkeletonDogCard() {
  return (
    <div className="rounded-xl border border-hairline bg-canvas overflow-hidden animate-pulse">
      <div className="aspect-square bg-surface-card" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-surface-card rounded w-3/4" />
        <div className="h-3 bg-surface-card rounded w-1/2" />
      </div>
    </div>
  )
}

export function SkeletonKennelCard() {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-card flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-surface-card rounded w-2/3" />
          <div className="h-3 bg-surface-card rounded w-1/3" />
          <div className="h-3 bg-surface-card rounded w-full mt-1" />
        </div>
      </div>
    </div>
  )
}

/** Devuelve N copias del skeleton dado (para rellenar el sentinel) */
export function SkeletonGrid({
  count = 6, type,
}: {
  count?: number
  type: 'dog' | 'kennel'
}) {
  const Skel = type === 'dog' ? SkeletonDogCard : SkeletonKennelCard
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skel key={i} />
      ))}
    </>
  )
}
