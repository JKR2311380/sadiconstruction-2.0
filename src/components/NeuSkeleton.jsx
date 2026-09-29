import { cn } from "@/lib/utils"
import { SpineIcon } from "@/components/brand/SpineIcon"

export function NeuSkeleton({ className, ...props }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} {...props} />
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-4 bg-background p-6" aria-busy="true" aria-label="Loading workspace">
      <div className="flex items-center gap-3">
        <SpineIcon size={40} motion="loading" />
        <NeuSkeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <NeuSkeleton className="h-28" />
        <NeuSkeleton className="h-28" />
        <NeuSkeleton className="h-28" />
      </div>
      <NeuSkeleton className="h-72" />
    </div>
  )
}
