export const formatBytes = (n: number) =>
  n > 1e6 ? `${(n / 1e6).toFixed(1)} Mo` : n > 1e3 ? `${Math.round(n / 1e3)} Ko` : `${n} o`

export const formatCount = (n: number) => (n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)} k` : String(n))
