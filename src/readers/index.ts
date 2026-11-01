import { parseCsv } from "../lib/csv";
import { detectCurrency, type Currency } from "../lib/currency";
import type { DateOrder } from "../lib/dates";
import { linesToTxns } from "../lib/lines";
import { findMapping, rowsToTxns, type Mapping, type Txn } from "../lib/table";
import { decodeText } from "../lib/text";
import { ReadError } from "./errors";

export { ReadError } from "./errors";

export interface ReadResult {
  txns: Txn[];
  currency?: Currency;
}

function fromRows(sheets: string[][][], order: DateOrder): ReadResult {
  let best: Txn[] = [];
  let firstRows: string[][] | undefined;
  for (const rows of sheets) {
    if (!rows.length) continue;
    firstRows ??= rows;
    const mapping = findMapping(rows);
    if (!mapping) continue;
    const txns = rowsToTxns(rows, mapping, order);
    if (txns.length > best.length) best = txns;
  }
  if (!best.length) throw new ReadError(firstRows ? "columns" : "empty", firstRows?.slice(0, 40));
  return { txns: best, currency: detectCurrency(sheets.flat(2).join(" ")) };
}

/** For the column picker: read rows again with columns chosen by the user. */
export function fromMapping(rows: string[][], mapping: Mapping, order: DateOrder): ReadResult {
  const txns = rowsToTxns(rows, mapping, order);
  if (!txns.length) throw new ReadError("empty");
  return { txns, currency: detectCurrency(rows.flat().join(" ")) };
}

export async function readText(text: string, order: DateOrder): Promise<ReadResult> {
  if (/<table[\s>]/i.test(text.slice(0, 20_000))) {
    const { sheetRows } = await import("./spreadsheet");
    return fromRows(sheetRows(text), order);
  }
  const rows = parseCsv(text);
  const tabular = rows.filter((row) => row.length >= 3).length >= rows.length / 2;
  if (tabular) {
    try {
      return fromRows([rows], order);
    } catch (error) {
      // Some pasted tables have no header and odd columns; the line reader may still make sense of them.
      const txns = linesToTxns(text.split(/\r?\n/), order);
      if (txns.length) return { txns, currency: detectCurrency(text) };
      throw error;
    }
  }
  const txns = linesToTxns(text.split(/\r?\n/), order);
  if (!txns.length) throw new ReadError("empty");
  return { txns, currency: detectCurrency(text) };
}

const startsWith = (bytes: Uint8Array, ...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);

export async function readFile(file: File, order: DateOrder, password?: string): Promise<ReadResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) throw new ReadError("empty");
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  if (head.includes("%PDF-")) {
    const { pdfLines } = await import("./pdf");
    const lines = await pdfLines(bytes, password);
    const txns = linesToTxns(lines, order);
    if (!txns.length) throw new ReadError("empty");
    return { txns, currency: detectCurrency(lines.join(" ")) };
  }
  // Zip (xlsx, ods) or the old binary Excel format.
  if (startsWith(bytes, 0x50, 0x4b) || startsWith(bytes, 0xd0, 0xcf, 0x11, 0xe0)) {
    const { sheetRows } = await import("./spreadsheet");
    let sheets: string[][][];
    try {
      sheets = sheetRows(bytes);
    } catch {
      throw new ReadError("unsupported");
    }
    return fromRows(sheets, order);
  }
  if (bytes.subarray(0, 4096).filter((byte) => byte === 0).length > 64 && !startsWith(bytes, 0xff, 0xfe)) {
    throw new ReadError("unsupported");
  }
  return readText(decodeText(bytes), order);
}
