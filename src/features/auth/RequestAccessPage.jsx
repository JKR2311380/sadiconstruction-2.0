import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspaceStore } from "@/store/workspace"

export function RequestAccessPage() {
  const submitAccessRequest = useWorkspaceStore((state) => state.submitAccessRequest)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyNote, setCompanyNote] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    submitAccessRequest({ email, fullName, companyNote })
    setSubmitted(true)
    toast.success("Access Request queued for Admin review")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-black/5 bg-primary">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-8">
          <Link to="/" className="font-heading text-[20px] tracking-tight text-foreground">
            Sadiconstruction
          </Link>
          <Link to="/login" className="text-sm font-medium text-foreground hover:underline">
            Log in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-4xl text-foreground">Request Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An Admin reviews this Access Request before any Staff Member credentials exist. There is no open signup.
          </p>

          {submitted ? (
            <div className="mt-8 border border-border bg-card p-5">
              <p className="font-medium text-foreground">Request received.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You will not be able to sign in until an Admin approves the queue. No partial account was created.
              </p>
              <Button asChild variant="secondary" className="mt-4 rounded-none">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    className="rounded-none"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="req-email">Work email</FieldLabel>
                  <Input
                    id="req-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="rounded-none"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="note">Why you need access</FieldLabel>
                  <Textarea
                    id="note"
                    value={companyNote}
                    onChange={(event) => setCompanyNote(event.target.value)}
                    className="min-h-24 rounded-none"
                  />
                  <FieldDescription>Optional. Admins see this in Settings → Access Requests.</FieldDescription>
                </Field>
                <Button type="submit" variant="secondary" className="rounded-none">
                  Submit Access Request
                </Button>
              </FieldGroup>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
