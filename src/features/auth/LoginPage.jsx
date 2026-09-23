import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordField } from "@/components/PasswordField"
import { WorkspaceSkeleton } from "@/components/NeuSkeleton"
import { AuthLayout } from "@/features/auth/AuthLayout"
import { isSupabaseConfigured } from "@/features/auth/session"
import { STAFF, DEMO_PASSWORD } from "@/data/mock/seed"
import { useSessionStore } from "@/store/session"

export function LoginPage() {
  const staff = useSessionStore((state) => state.staff)
  const status = useSessionStore((state) => state.status)
  const signIn = useSessionStore((state) => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("planner@sadicon.local")
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  if (status !== "ready") {
    return <WorkspaceSkeleton />
  }

  if (staff) {
    return <Navigate to={location.state?.from || "/projects"} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    const result = await signIn(email, password)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }
    toast.success(`Signed in as ${result.staff.roleLabel}`)
    navigate(location.state?.from || "/projects", { replace: true })
  }

  return (
    <AuthLayout
      alt={
        <Link to="/signup" className="text-sm font-medium text-foreground hover:underline">
          Sign up
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="w-full">
        <h1 className="font-heading text-3xl text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Email and password. New Staff Members use Sign-up — they start as Planners.
        </p>

        <FieldGroup className="mt-8">
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <PasswordField
              id="password"
              value={password}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setPassword(event.target.value)
                setError("")
              }}
              required
              minLength={6}
            />
            {error ? <FieldDescription>{error}</FieldDescription> : null}
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>

        <div className="neu-in mt-8 rounded-2xl p-4 text-[12px] text-muted-foreground">
          <p className="font-medium text-foreground">Seeded Staff Members (password: {DEMO_PASSWORD})</p>
          {isSupabaseConfigured ? (
            <p className="mt-2">Apply supabase/migrations and supabase/seed.sql, and turn Auth confirmations off.</p>
          ) : (
            <p className="mt-2">
              Mock session — set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to use Supabase Auth.
            </p>
          )}
          <ul className="mt-2 flex flex-col gap-1">
            {STAFF.map((row) => (
              <li key={row.email}>
                <button
                  type="button"
                  className="text-left hover:text-primary hover:underline"
                  onClick={() => {
                    setEmail(row.email)
                    setPassword(row.password)
                    setError("")
                  }}
                >
                  {row.email} — {row.fullName} ({row.role})
                </button>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </AuthLayout>
  )
}
