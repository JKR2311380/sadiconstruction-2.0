import { LandingHero } from "./features/landing/LandingHero"
import { ProductProof } from "./features/landing/ProductProof"
import { FeatureBeats } from "./features/landing/FeatureBeats"
import { CampusArtefact } from "./features/landing/CampusArtefact"
import { LandingClose } from "./features/landing/LandingClose"
import "./features/landing/acoustic.css"

export default function LandingPage() {
  return (
    <div className="acoustic-root">
      <LandingHero />
      <ProductProof />
      <FeatureBeats />
      <CampusArtefact />
      <LandingClose />
    </div>
  )
}
