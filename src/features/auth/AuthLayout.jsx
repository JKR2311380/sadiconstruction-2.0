import { Link } from "react-router-dom"
import { SkipToContent } from "@/features/shell/AppUtilities"

export function AuthLayout({ alt, children }) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SkipToContent />
      <header className="no-print sticky top-0 z-20 bg-background/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-[15px] font-semibold tracking-tight">
            <span className="neu-out grid size-12 place-items-center rounded-2xl" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M2 11 L7 2 L12 11 Z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            Sadiconstruction
          </Link>
          {alt}
        </div>
      </header>
      <main id="app-main" className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="neu-out w-full max-w-lg rounded-[1.75rem] p-10">{children}</div>
      </main>
    </div>
  )
}
