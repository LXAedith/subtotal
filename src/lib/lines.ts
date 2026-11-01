import { inferDecimal, parseAmount } from "./amount";
import { inferDateOrder, matchDate, type DateOrder } from "./dates";
import { orient, type Txn } from "./table";
import { fold } from "./text";

// Two decimals required, so "1/6" (instalments), "2026" or a card number never count as an amount.
// Spaces are not accepted as thousands separators: "STORE 12 259,99" must read 259,99, not 12 259,99.
const AMOUNT = /(?<![\d.,])[-+−]?\(?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\)?-?(?!\d|[.,]\d)/g;
const SUMMARY = /toplam|total|bakiye|balance|devreden|onceki donem|asgari|minimum|son odeme|hesap kesim|statement|payment due|limit|faiz orani|interest rate/;

/**
 * Parses statement text line by line, as found in PDF statements or text pasted from online banking:
 * a date at the start, then the description, then the amount. A second date (value date) is skipped.
 */
export function linesToTxns(lines: string[], fallbackOrder: DateOrder): Txn[] {
  const order = inferDateOrder(lines.map((line) => line.trim().slice(0, 10)), fallbackOrder);
  const decimal = inferDecimal(lines.flatMap((line) => line.match(AMOUNT) ?? []));
  const txns: Txn[] = [];
  for (const line of lines) {
    const first = matchDate(line, order);
    if (!first) continue;
    let start = first.length;
    const second = matchDate(line.slice(start), order);
    if (second) start += second.length;
    const rest = line.slice(start);
    AMOUNT.lastIndex = 0;
    const found = AMOUNT.exec(rest);
    if (!found) continue;
    const text = rest.slice(0, found.index).replace(/\s+/g, " ").trim();
    const value = parseAmount(found[0], decimal);
    if (!text || !value || SUMMARY.test(fold(text))) continue;
    txns.push({ date: first.time, text, amount: value });
  }
  return orient(txns);
}
