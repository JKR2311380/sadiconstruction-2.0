const PATTERN = /^PRJ-(\d{4})-(\d{3})$/

export function nextProjectCode(projects, year = new Date().getFullYear()) {
  const serials = projects
    .map((project) => project.code)
    .map((code) => PATTERN.exec(code))
    .filter((match) => match && Number(match[1]) === year)
    .map((match) => Number(match[2]))
  const next = (serials.length ? Math.max(...serials) : 0) + 1
  return `PRJ-${year}-${String(next).padStart(3, "0")}`
}

export function isProjectCode(code) {
  return PATTERN.test(code)
}
