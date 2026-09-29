import { cn } from "@/lib/utils"
import "./spine-mark.css"

export type SpineVariant = "blue" | "ink" | "ground" | "navy" | "white"
export type SpineMotion = "reveal" | "loading" | "recalculating" | "handover"

/** A finish-to-start link drawn as an S: start node (48,16) → handover ring (16,48) on a 64u tile. */
const PATH = "M48 16 H16 V32 H48 V48 H22"

interface SpineIconProps {
  size?: number
  variant?: SpineVariant
  motion?: SpineMotion
  /** Accessible name; omit when the brand name is already next to the icon. */
  title?: string
  className?: string
}

/** The Spine S brand mark (DESIGN.md § Mark). At 20px and below the handover ring closes to a solid dot. */
export function SpineIcon({ size = 32, variant = "blue", motion, title, className }: SpineIconProps) {
  const solidEnd = size <= 20
  const ripple = motion === "reveal" || motion === "handover"
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("spine", `spine--${variant}`, motion && `spine--${motion}`, className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect className="spine__tile" width="64" height="64" rx="14" />
      {motion === "recalculating" && <path className="spine__path spine__path--base" d={PATH} />}
      <path className="spine__path" d={PATH} pathLength={100} />
      <circle className="spine__node" cx="48" cy="16" r="5" />
      {ripple && <circle className="spine__ripple" cx="16" cy="48" r="6" />}
      <g className="spine__end">
        <circle className="spine__ring" cx="16" cy="48" r="6" data-solid={solidEnd || undefined} />
        {!solidEnd && <circle className="spine__dot" cx="16" cy="48" r="2.2" />}
      </g>
    </svg>
  )
}
