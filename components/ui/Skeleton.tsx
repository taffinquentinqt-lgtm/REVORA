export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/** A row of skeletons mimicking the results table while analysis runs. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="ml-auto h-4 w-[60px]" />
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
