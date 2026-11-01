import { DAY, isoDate } from "./dates";
import type { Txn } from "./table";
import { fold } from "./text";

const keyOf = (txn: Txn) => `${txn.date}|${txn.amount.toFixed(2)}|${fold(txn.text).replace(/\s+/g, " ").slice(0, 32)}`;

/**
 * Adds new statement lines to the remembered ones. The same line from an overlapping export appears once,
 * but two genuine identical charges in one file (two coffees) are both kept.
 */
export function mergeTxns(existing: Txn[], incoming: Txn[]): Txn[] {
  const seen = new Map<string, number>();
  for (const txn of existing) seen.set(keyOf(txn), (seen.get(keyOf(txn)) ?? 0) + 1);
  const added = new Map<string, number>();
  const result = [...existing];
  for (const txn of incoming) {
    const key = keyOf(txn);
    const count = (added.get(key) ?? 0) + 1;
    added.set(key, count);
    if (count > (seen.get(key) ?? 0)) result.push(txn);
  }
  return result.sort((a, b) => a.date - b.date);
}

/** Keeps the last 25 months, enough to see yearly renewals twice. */
export function trimHistory(txns: Txn[]): Txn[] {
  if (!txns.length) return txns;
  const end = Math.max(...txns.map((txn) => txn.date));
  return txns.filter((txn) => end - txn.date <= 762 * DAY);
}

/** Compact storage form: only outgoing lines, three short fields each. */
export function pack(txns: Txn[]): [string, string, number][] {
  return txns.filter((txn) => txn.amount > 0).map((txn) => [isoDate(txn.date), txn.text, txn.amount]);
}

export function unpack(rows: unknown): Txn[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!Array.isArray(row) || row.length !== 3) return [];
    const [date, text, amount] = row as [unknown, unknown, unknown];
    const time = typeof date === "string" ? Date.parse(`${date}T00:00:00Z`) : NaN;
    if (!Number.isFinite(time) || typeof text !== "string" || typeof amount !== "number") return [];
    return [{ date: time, text, amount }];
  });
}
