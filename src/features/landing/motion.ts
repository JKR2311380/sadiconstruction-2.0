export const acousticEase = [0.22, 1, 0.36, 1] as const

export const textRevealVariant = {
  hidden: { y: 20, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: acousticEase },
  },
}

export const heroContainerVariant = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.12 },
  },
}

export const glassPanelVariant = {
  hidden: { y: 40, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: acousticEase, staggerChildren: 0.15 },
  },
  exit: {
    y: -20,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.4, ease: "easeIn" },
  },
}

export const glassChildVariant = {
  hidden: { y: 16, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: acousticEase },
  },
}

export const pipVariant = {
  idle: { scale: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  active: {
    scale: 1.15,
    backgroundColor: "#D4AF37",
    boxShadow: "0 8px 20px rgba(212,175,55,0.15)",
    transition: { duration: 0.45, ease: acousticEase },
  },
}

export const reducedTextReveal = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
}

export const reducedGlassPanel = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}
