import { Link } from "react-router-dom"
import { LogIn, UserPlus } from "lucide-react"

export function LandingClose() {
  return (
    <section id="enter" className="relative bg-espresso-deep px-5 py-20 text-latte sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[0.84] tracking-[-0.035em] text-balance">
          Sign up if you have a seat to take.
        </h2>
        <p className="mt-5 max-w-[36ch] font-ui text-[clamp(1.15rem,2vw,1.45rem)] font-semibold leading-tight text-foam">
          Internal project controls. Planners author the network. Managers read Longest Path in the
          room.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            className="acoustic-focus inline-flex h-11 min-h-11 items-center gap-2 rounded-full bg-amber px-5 font-display text-[0.95rem] tracking-[0.08em] uppercase text-espresso no-underline shadow-glow-amber"
            to="/signup"
          >
            <UserPlus size={16} strokeWidth={1.75} aria-hidden />
            Sign up
          </Link>
          <Link
            className="acoustic-focus bg-glass-thin inline-flex h-11 min-h-11 items-center gap-2 rounded-full px-5 font-display text-[0.95rem] tracking-[0.08em] uppercase text-latte no-underline"
            to="/login"
          >
            <LogIn size={16} strokeWidth={1.75} aria-hidden />
            Sign in
          </Link>
        </div>
      </div>
    </section>
  )
}
