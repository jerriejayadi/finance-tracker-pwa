/** Format number as IDR — no decimals, dot thousands separator (id-ID convention) */
export function fmtIDR(n: number): string {
  const sign = n < 0 ? "\u2212" : "";
  const v = Math.abs(Math.round(n));
  return sign + "Rp " + v.toLocaleString("id-ID");
}

/** Compact IDR: 1.500.000 -> Rp1,5jt; 250.000 -> Rp250rb; 30 -> Rp30 */
export function fmtIDRShort(n: number): string {
  const v = Math.abs(n);
  if (v >= 1_000_000)
    return (
      "Rp" +
      (v / 1_000_000)
        .toFixed(1)
        .replace(".", ",")
        .replace(",0", "") +
      "jt"
    );
  if (v >= 1_000) return "Rp" + Math.round(v / 1_000) + "rb";
  return "Rp" + v;
}
