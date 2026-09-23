import { isSupabaseConfigured } from "@/lib/supabaseClient"

export function DemoBanner() {
  return (
    <p className="no-print px-4 py-2.5 text-center text-[11px] text-muted-foreground">
      {isSupabaseConfigured
        ? "Synthetic demo data · Supabase session · CPM runs in the browser"
        : "Synthetic demo data · mock session (set VITE_SUPABASE_* to use Auth) · CPM runs in the browser"}
    </p>
  )
}
