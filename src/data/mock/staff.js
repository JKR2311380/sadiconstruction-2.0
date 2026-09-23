import { STAFF } from "@/data/mock/seed"

const STORAGE_KEY = "sadicon-mock-staff"

function cloneSeedStaff() {
  return structuredClone(STAFF)
}

export function loadMockStaff() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSeedStaff()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return cloneSeedStaff()
    return parsed
  } catch {
    return cloneSeedStaff()
  }
}

export function saveMockStaff(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function publicStaff(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    isActive: row.isActive !== false,
  }
}
