export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="aspect-video w-full rounded-2xl bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
    </div>
  )
}
