export const ROLES = ["admin", "planner"]

export const CAPABILITIES = {
  changeRole: ["admin"],
  createProject: ["admin", "planner"],
  archiveProject: ["admin", "planner"],
  seedBoq: ["admin", "planner"],
  editSchedule: ["admin", "planner"],
  viewSchedule: ["admin", "planner"],
  uploadDocuments: ["admin", "planner"],
  editPersonnel: ["admin", "planner"],
}

export function can(role, capability) {
  return CAPABILITIES[capability]?.includes(role) ?? false
}

export const ROLE_LABELS = {
  admin: "Admin",
  planner: "Planner",
}

export function isStaffRole(role) {
  return ROLES.includes(role)
}
