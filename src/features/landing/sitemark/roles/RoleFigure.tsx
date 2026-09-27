import { Mascot, type RoleId } from "../Mascot"

export function RoleFigure({
  role,
  reduced,
}: {
  role: RoleId
  reduced: boolean
  near: boolean
}) {
  return (
    <div className="sm-roles__figure-stage" aria-hidden>
      <div className="sm-roles__figure-fallback">
        <Mascot role={role} reduced={reduced} />
      </div>
    </div>
  )
}
