export const CURRENCIES = ["TRY", "USD", "EUR", "GBP", "CHF", "CAD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SIGNS: [Currency, RegExp][] = [
  ["TRY", /₺|\bTL\b|\bTRY\b|\bYTL\b/g],
  ["USD", /\$|\bUSD\b/g],
  ["EUR", /€|\bEUR\b/g],
  ["GBP", /£|\bGBP\b/g],
  ["CHF", /\bCHF\b/g],
];

/** The currency mentioned most often in the file, if any. Foreign charges on a lira card mention USD too. */
export function detectCurrency(text: string): Currency | undefined {
  let best: Currency | undefined;
  let bestCount = 0;
  for (const [currency, pattern] of SIGNS) {
    const count = text.match(pattern)?.length ?? 0;
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

/** A sensible default from the browser's region when the file does not say. */
export function currencyForLocale(language: string): Currency {
  const lang = language.toLowerCase();
  if (lang.startsWith("tr")) return "TRY";
  if (lang === "en-gb") return "GBP";
  if (lang === "en-ca" || lang === "fr-ca") return "CAD";
  if (lang === "en-au") return "AUD";
  if (lang.endsWith("-ch")) return "CHF";
  if (/^(de|fr|es|it|nl|pt|fi|el|sk|sl|et|lv|lt|ga|mt|hr)\b/.test(lang)) return "EUR";
  return "USD";
}
