import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { STAFF } from "@/data/mock/seed"
import { useSessionStore } from "@/store/session"

export function LoginPage() {
  const signIn = useSessionStore((state) => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("planner@sadicon.local")
  const [password, setPassword] = useState("demo")
  const [error, setError] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    const result = signIn(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast.success(`Signed in as ${result.staff.roleLabel}`)
    const dest = location.state?.from || "/projects"
    navigate(dest, { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-black/5 bg-primary">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-8">
          <Link to="/" className="font-heading text-[20px] tracking-tight text-foreground">
            Sadiconstruction
          </Link>
          <Link to="/request-access" className="text-sm font-medium text-foreground hover:underline">
            Request Access
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <h1 className="font-heading text-4xl text-foreground">Staff sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal credentials only. Guests submit an Access Request.
          </p>

          <FieldGroup className="mt-8">
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={email}
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError("")
                }}
                required
                className="rounded-none"
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={password}
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                required
                className="rounded-none"
              />
              {error ? <FieldDescription>{error}</FieldDescription> : null}
            </Field>
            <Button type="submit" variant="secondary" className="rounded-none">
              Sign in
            </Button>
          </FieldGroup>

          <div className="mt-8 border border-border bg-card p-4 text-[12px] text-muted-foreground">
            <p className="font-medium text-foreground">Demo staff (password: demo)</p>
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
                    {row.email} — {row.fullName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </main>
    </div>
  )
}
