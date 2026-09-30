/** Format HKD cents as "HK$88" or "HK$88.50". */
export function formatHKD(cents: number | null | undefined, opts: { sign?: boolean } = {}): string {
  const value = Math.round(cents ?? 0);
  const negative = value < 0;
  const abs = Math.abs(value);
  const hasCents = abs % 100 !== 0;
  const body = (abs / 100).toLocaleString("en-HK", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const prefix = negative ? "−" : opts.sign && value > 0 ? "+" : "";
  return `${prefix}HK$${body}`;
}

/** Parse "88", "88.5", "HK$1,200" into cents. Returns null when invalid. */
export function parseHKDToCents(input: string): number | null {
  const cleaned = input.replace(/hk\$|\$|,|\s/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}
