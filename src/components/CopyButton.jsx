import { useState } from "react"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function CopyButton({ value, label = "Copy", className }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("Copied")
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn("neu-btn grid size-10 place-items-center rounded-full", className)}
        onClick={() => void copy()}
        aria-label={copied ? "Copied" : label}
      >
        {copied ? <Check /> : <Copy />}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : label}</TooltipContent>
    </Tooltip>
  )
}
