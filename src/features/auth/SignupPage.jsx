import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordField } from "@/components/PasswordField"
import { WorkspaceSkeleton } from "@/components/NeuSkeleton"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { useSessionStore } from "@/store/session"

export function SignupPage() {
  const staff = useSessionStore((state) => state.staff)
  const status = useSessionStore((state) => state.status)
  const signUp = useSessionStore((state) => state.signUp)
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  if (status !== "ready") {
    return <WorkspaceSkeleton />
  }

  if (staff && !done) {
    return <Navigate to="/projects" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    const result = await signUp({ email, password, fullName })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    toast.success("Signed up as Planner")
    setDone(true)
  }

  return (
    <AuthLayout
      alt={
        <Link to="/login" className="text-sm font-medium text-foreground hover:underline">
          Sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="w-full">
        <h1 className="font-heading text-3xl text-foreground">Sign up</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public Sign-up with email and password. No email verification. New accounts are Planners.
        </p>

        <FieldGroup className="mt-8">
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              value={fullName}
              autoComplete="name"
              onChange={(event) => {
                setFullName(event.target.value)
                setError("")
              }}
              required
            />
          </Field>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Input
              id="signup-email"
              type="email"
              value={email}
              autoComplete="username"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setEmail(event.target.value)
                setError("")
              }}
              required
            />
          </Field>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <PasswordField
              id="signup-password"
              value={password}
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setPassword(event.target.value)
                setError("")
              }}
              required
              minLength={6}
            />
            {error ? (
              <FieldDescription>{error}</FieldDescription>
            ) : (
              <FieldDescription>At least 6 characters (Supabase Auth default).</FieldDescription>
            )}
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating account…" : "Sign up"}
          </Button>
        </FieldGroup>
      </form>
      <FeedbackDialog
        open={done}
        onOpenChange={setDone}
        tone="success"
        title="Account created"
        description="You are signed in as a Planner. Continue to the project directory."
        actionLabel="Open projects"
        onAction={() => navigate("/projects", { replace: true })}
      />
    </AuthLayout>
  )
}
