import { inferDecimal, looksLikeAmount, parseAmount } from "./amount";
import { inferDateOrder, matchDate, parseDate, type DateOrder } from "./dates";
import { fold } from "./text";

/** One statement line. `amount` > 0 is money going out, < 0 is money coming in. */
export interface Txn {
  date: number;
  text: string;
  amount: number;
}

export interface Mapping {
  headerRow: number;
  date: number;
  text: number;
  amount?: number;
  debit?: number;
  credit?: number;
  /** A column holding "B"/"A", "Borç"/"Alacak", "DR"/"CR" next to unsigned amounts. */
  side?: number;
}

type Role = "balance" | "date" | "debit" | "credit" | "amount" | "text";

// Checked in this order, so "İşlem Tarihi" is a date and "İşlem Tutarı" an amount even though both say "işlem".
const ROLE_WORDS: [Role, RegExp][] = [
  ["balance", /bakiye|balance|saldo|kalan/],
  ["date", /tarih|date|datum|fecha|\bdata\b|posted|posting/],
  ["debit", /borc|debit|withdrawal|paid out|money out|giden|cikis|harcama/],
  ["credit", /alacak|credit|deposit|paid in|money in|gelen|giris/],
  ["amount", /tutar|amount|miktar|betrag|importe|\bvalue\b|\bsum\b/],
  ["text", /aciklama|description|detay|details|merchant|isyeri|payee|narrative|memo|islem|transaction|\bname\b|referans|reference|concepto|beschreibung|bilgi/],
];

function roleOf(cell: string): Role | undefined {
  const folded = fold(cell).trim();
  if (!folded || folded.length > 40 || /\d{3}/.test(folded)) return undefined;
  return ROLE_WORDS.find(([, words]) => words.test(folded))?.[0];
}

/** Finds the header row by its words; falls back to guessing the columns from their contents. */
export function findMapping(rows: string[][]): Mapping | null {
  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const found: Partial<Record<Role, number>> = {};
    rows[r].forEach((cell, c) => {
      const role = roleOf(cell);
      if (role && found[role] === undefined) found[role] = c;
    });
    const hasMoney = found.amount !== undefined || found.debit !== undefined || found.credit !== undefined;
    if (found.date === undefined || !hasMoney) continue;
    const text = found.text ?? longestTextColumn(rows.slice(r + 1), Object.values(found));
    if (text === undefined) continue;
    const mapping: Mapping = { headerRow: r, date: found.date, text };
    if (found.amount !== undefined) mapping.amount = found.amount;
    if (found.debit !== undefined) mapping.debit = found.debit;
    if (found.credit !== undefined) mapping.credit = found.credit;
    if (mapping.amount === undefined && (mapping.debit === undefined || mapping.credit === undefined)) {
      // A lone "Borç" or "Alacak" column is used as the amount column.
      mapping.amount = mapping.debit ?? mapping.credit;
      delete mapping.debit;
      delete mapping.credit;
    }
    const side = sideColumn(rows.slice(r + 1), mapping);
    if (side !== undefined) mapping.side = side;
    return mapping;
  }
  return guessMapping(rows);
}

function columnCount(rows: string[][]): number {
  return Math.max(0, ...rows.map((row) => row.length));
}

function longestTextColumn(rows: string[][], exclude: number[]): number | undefined {
  let best: number | undefined;
  let bestLength = 0;
  for (let c = 0; c < columnCount(rows); c++) {
    if (exclude.includes(c)) continue;
    const cells = rows.map((row) => row[c] ?? "").filter((cell) => cell && !looksLikeAmount(cell) && parseDate(cell) === null);
    const length = cells.reduce((sum, cell) => sum + cell.length, 0) / Math.max(1, rows.length);
    if (length > bestLength) {
      bestLength = length;
      best = c;
    }
  }
  return bestLength >= 3 ? best : undefined;
}

const SIDE_VALUES = /^(b|a|borc|alacak|d|c|dr|cr|debit|credit)$/;

function sideColumn(rows: string[][], mapping: Mapping): number | undefined {
  if (mapping.amount === undefined || mapping.debit !== undefined) return undefined;
  for (let c = 0; c < columnCount(rows); c++) {
    if (c === mapping.amount || c === mapping.date || c === mapping.text) continue;
    const cells = rows.map((row) => fold(row[c] ?? "").trim()).filter(Boolean);
    if (cells.length >= 2 && cells.filter((cell) => SIDE_VALUES.test(cell)).length / cells.length > 0.9) return c;
  }
  return undefined;
}

function guessMapping(rows: string[][]): Mapping | null {
  const sample = rows.slice(0, 400);
  const fraction = (c: number, test: (cell: string) => boolean) => {
    const cells = sample.map((row) => row[c] ?? "").filter(Boolean);
    return cells.length ? cells.filter(test).length / sample.length : 0;
  };
  let date = -1;
  let bestDate = 0.5;
  for (let c = 0; c < columnCount(sample); c++) {
    const share = fraction(c, (cell) => parseDate(cell) !== null);
    if (share > bestDate) {
      bestDate = share;
      date = c;
    }
  }
  if (date < 0) return null;
  const text = longestTextColumn(sample, [date]);
  if (text === undefined) return null;
  const numeric: number[] = [];
  for (let c = 0; c < columnCount(sample); c++) {
    if (c !== date && c !== text && fraction(c, looksLikeAmount) >= 0.6) numeric.push(c);
  }
  if (!numeric.length) return null;
  // Statements put the amount right after the description and the running balance last.
  const amount = numeric.find((c) => c > text) ?? numeric[0];
  return { headerRow: -1, date, text, amount };
}

/** Rows to transactions with the sign normalised to "money out is positive". */
export function rowsToTxns(rows: string[][], mapping: Mapping, fallbackOrder: DateOrder): Txn[] {
  const body = rows.slice(mapping.headerRow + 1);
  const order = inferDateOrder(
    body.map((row) => row[mapping.date] ?? ""),
    fallbackOrder,
  );
  const decimalOf = (c: number | undefined) => (c === undefined ? undefined : inferDecimal(body.map((row) => row[c] ?? "")));
  const decimals = { amount: decimalOf(mapping.amount), debit: decimalOf(mapping.debit), credit: decimalOf(mapping.credit) };

  const signed: Txn[] = [];
  let fromColumns = false;
  for (const row of body) {
    const date = matchDate(row[mapping.date] ?? "", order)?.time;
    const text = (row[mapping.text] ?? "").replace(/\s+/g, " ").trim();
    if (date === undefined || !text) continue;
    let value: number | null = null;
    if (mapping.debit !== undefined || mapping.credit !== undefined) {
      const out = mapping.debit !== undefined ? parseAmount(row[mapping.debit] ?? "", decimals.debit) : null;
      const inn = mapping.credit !== undefined ? parseAmount(row[mapping.credit] ?? "", decimals.credit) : null;
      if (out) value = Math.abs(out);
      else if (inn) value = -Math.abs(inn);
      fromColumns = true;
    } else if (mapping.amount !== undefined) {
      value = parseAmount(row[mapping.amount] ?? "", decimals.amount);
      if (value !== null && mapping.side !== undefined) {
        const side = fold(row[mapping.side] ?? "").trim();
        value = /^(a|alacak|c|cr|credit)$/.test(side) ? -Math.abs(value) : Math.abs(value);
        fromColumns = true;
      }
    }
    if (value) signed.push({ date, text, amount: value });
  }
  return fromColumns ? signed : orient(signed);
}

/**
 * A card statement lists purchases as positive numbers and payments as negative; a bank account does the
 * opposite. Purchases are the more frequent kind in both, so the majority sign is taken as "money out".
 */
export function orient(txns: Txn[]): Txn[] {
  const negatives = txns.filter((txn) => txn.amount < 0).length;
  if (negatives <= txns.length - negatives) return txns;
  return txns.map((txn) => ({ ...txn, amount: -txn.amount }));
}
