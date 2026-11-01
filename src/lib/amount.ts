export type Decimal = "," | ".";

const CURRENCY = /\b(?:TRY|TL|YTL|USD|EUR|GBP|CHF)\b|[₺$€£]/gi;

/** Decides per column whether "1.234,56" (comma) or "1,234.56" (dot) is used, by counting telltale endings. */
export function inferDecimal(values: string[]): Decimal | undefined {
  let comma = 0;
  let dot = 0;
  for (const raw of values) {
    const value = raw.replace(CURRENCY, "").replace(/[\s()+-]/g, "");
    if (/\d,\d{1,2}$/.test(value) || /\d\.\d{3},/.test(value)) comma++;
    else if (/\d\.\d{1,2}$/.test(value) || /\d,\d{3}\./.test(value)) dot++;
  }
  if (!comma && !dot) return undefined;
  return comma > dot ? "," : ".";
}

/**
 * Parses bank-style amounts: "1.234,56 TL", "-259,99", "(17.99)", "259,99-", "$1,234.56", "1 234,56".
 * Returns null for anything that is not a plain number.
 */
export function parseAmount(raw: string, decimal?: Decimal): number | null {
  let s = raw.replace(CURRENCY, "").replace(/[\s  ']/g, "").replace("−", "-");
  if (!s) return null;
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) s = s.slice(1);
  if (!/^\d[\d.,]*$/.test(s) || /[.,]$/.test(s)) return null;

  const dec = decimal ?? guessDecimal(s);
  const thousands = dec === "," ? "." : ",";
  let normalized = s.split(thousands).join("");
  if (dec === ",") normalized = normalized.replace(",", ".");
  if ((normalized.match(/[.,]/g) ?? []).length > 1) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

function guessDecimal(s: string): Decimal {
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) return lastComma > lastDot ? "," : ".";
  // A single separator followed by exactly three digits is a thousands separator: "1,234" or "1.234".
  if (lastComma >= 0) return /,\d{3}$/.test(s) ? "." : ",";
  if (lastDot >= 0) return /\.\d{3}$/.test(s) && (s.match(/\./g) ?? []).length > 1 ? "," : ".";
  return ".";
}

/** Rough number test used to find the amount column when there is no header row. */
export function looksLikeAmount(raw: string): boolean {
  return /\d/.test(raw) && parseAmount(raw) !== null && !/^\d{4,}$/.test(raw.trim());
}
