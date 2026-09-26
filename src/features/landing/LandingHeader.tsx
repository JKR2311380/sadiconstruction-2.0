import { Link } from "react-router-dom"

export function LandingHeader() {
  return (
    <header className="relative z-10 flex items-start justify-between px-5 pt-5 sm:px-8 sm:pt-7">
      <p className="font-display text-[clamp(1.2rem,2vw,1.6rem)] font-bold tracking-[0.22em] text-latte">
        SADICON
      </p>
      <nav className="flex gap-2" aria-label="Account">
        <Link
          className="acoustic-focus bg-glass-thin inline-flex h-11 min-h-11 items-center rounded-full px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte no-underline"
          to="/login"
        >
          Sign in
        </Link>
        <Link
          className="acoustic-focus inline-flex h-11 min-h-11 items-center rounded-full bg-amber px-4 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso no-underline shadow-glow-amber"
          to="/signup"
        >
          Sign up
        </Link>
      </nav>
    </header>
  )
}
