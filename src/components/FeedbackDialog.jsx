import { CircleAlert, CircleCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function FeedbackDialog({
  open,
  onOpenChange,
  tone = "success",
  title,
  description,
  actionLabel = "Continue",
  onAction,
}) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="neu-in mb-3 grid size-12 place-items-center rounded-2xl">
            <Icon className={tone === "error" ? "text-destructive" : "text-primary"} />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant={tone === "error" ? "outline" : "default"}
            onClick={() => {
              onAction?.()
              onOpenChange(false)
            }}
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
