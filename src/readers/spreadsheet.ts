import { read, utils } from "xlsx";

const pad = (n: number) => String(n).padStart(2, "0");

function cellText(value: unknown): string {
  if (value instanceof Date) {
    // SheetJS returns local-time dates that can be a few seconds off; round to the minute first.
    const date = new Date(Math.round(value.getTime() / 60_000) * 60_000);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  if (typeof value === "number") return String(value);
  return String(value ?? "").trim();
}

/** Every sheet as rows of text. Handles .xlsx, old .xls, .ods and the HTML tables some banks save as .xls. */
export function sheetRows(data: Uint8Array | string): string[][][] {
  // raw: HTML cells stay text, so "189,99" is not read as 18999 by an English number parser.
  const book = typeof data === "string" ? read(data, { type: "string", raw: true }) : read(data, { type: "array", cellDates: true });
  return book.SheetNames.map((name) =>
    utils
      .sheet_to_json<unknown[]>(book.Sheets[name], { header: 1, raw: true, defval: "" })
      .map((row) => row.map(cellText)),
  );
}
