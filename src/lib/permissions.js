export const CAPABILITIES = {
  approveAccess: ["admin"],
  createProject: ["admin", "planner"],
  archiveProject: ["admin", "planner"],
  seedBoq: ["admin"],
  editSchedule: ["admin", "planner"],
  viewSchedule: ["admin", "planner", "project_manager", "viewer"],
  uploadDocuments: ["admin", "planner", "project_manager"],
}

export function can(role, capability) {
  return CAPABILITIES[capability]?.includes(role) ?? false
}

export const ROLE_LABELS = {
  admin: "Admin",
  planner: "Planner",
  project_manager: "Project Manager",
  viewer: "Viewer",
}
