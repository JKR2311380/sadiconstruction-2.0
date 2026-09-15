export function formatPhp(amount, fractionDigits = 0) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(Number(amount) || 0)
}

export function formatPhpCompact(amount) {
  const value = Number(amount) || 0
  if (Math.abs(value) >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`
  }
  return formatPhp(value)
}
