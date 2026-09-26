import { cn } from "@/lib/utils"

export function NeuSkeleton({ className, ...props }) {
  return <div className={cn("neu-skeleton rounded-2xl", className)} {...props} />
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-4 bg-background p-6" aria-busy="true" aria-label="Loading workspace">
      <NeuSkeleton className="h-12 w-48" />
      <div className="grid gap-3 md:grid-cols-3">
        <NeuSkeleton className="h-28" />
        <NeuSkeleton className="h-28" />
        <NeuSkeleton className="h-28" />
      </div>
      <NeuSkeleton className="h-72" />
    </div>
  )
}
