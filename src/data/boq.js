import { parseBoqCsv } from "@/data/mock/csv"
import { mapBoq, mapLine, mapPhase } from "@/data/map"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export { parseBoqCsv }

function phasesPayload(phases) {
  return phases.map((phase) => ({
    code: phase.code,
    name: phase.name,
    color_token: phase.colorToken,
    sort_order: phase.sortOrder,
    lines: phase.lines.map((line, index) => ({
      item_code: line.itemCode,
      description: line.description,
      unit: line.unit,
      quantity: line.quantity,
      rate: line.rate,
      amount: line.amount,
      sort_order: index + 1,
    })),
  }))
}

export async function loadBoq(projectId) {
  const { data: boq, error } = await supabase
    .from("boqs")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle()
  if (error) throw error
  if (!boq) return null

  const { data: phases, error: phaseError } = await supabase
    .from("boq_phases")
    .select("*")
    .eq("boq_id", boq.id)
    .order("sort_order")
  if (phaseError) throw phaseError

  const phaseRows = phases ?? []
  const ids = phaseRows.map((row) => row.id)
  let lines = []
  if (ids.length) {
    const { data: lineRows, error: lineError } = await supabase
      .from("boq_lines")
      .select("*")
      .in("phase_id", ids)
      .order("sort_order")
    if (lineError) throw lineError
    lines = lineRows ?? []
  }

  const linesByPhase = new Map()
  for (const line of lines) {
    const list = linesByPhase.get(line.phase_id) || []
    list.push(mapLine(line))
    linesByPhase.set(line.phase_id, list)
  }

  return mapBoq(
    boq,
    phaseRows.map((phase) => mapPhase(phase, linesByPhase.get(phase.id) || [])),
  )
}

export async function loadAllBoqs(projectIds) {
  const result = {}
  await Promise.all(
    projectIds.map(async (id) => {
      result[id] = await loadBoq(id)
    }),
  )
  return result
}

export async function replaceBoqFromCsv(projectId, csvText) {
  const parsed = parseBoqCsv(csvText)
  if (!parsed.ok) return parsed
  const { error } = await supabase.rpc("replace_boq", {
    p_project_id: projectId,
    p_payload: {
      title: "Uploaded BOQ",
      phases: phasesPayload(parsed.phases),
    },
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export { isSupabaseConfigured }
