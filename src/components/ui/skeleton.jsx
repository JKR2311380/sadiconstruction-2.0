import { cn } from "cn"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("neu-skeleton rounded-2xl", className)}
      {...props}
    />
  )
}

export { Skeleton }
