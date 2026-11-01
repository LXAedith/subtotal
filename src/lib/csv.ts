const DELIMITERS = [",", ";", "\t", "|"];

/** Picks the delimiter that splits most of the first lines into the same number (> 1) of columns. */
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((line) => line.trim()).slice(0, 30);
  let best = ",";
  let bestScore = 0;
  for (const delimiter of DELIMITERS) {
    const counts = lines.map((line) => parseCsv(line, delimiter)[0]?.length ?? 0);
    const tally = new Map<number, number>();
    for (const count of counts) if (count > 1) tally.set(count, (tally.get(count) ?? 0) + 1);
    for (const [columns, lineCount] of tally) {
      const score = lineCount * 100 + columns;
      if (score > bestScore) {
        bestScore = score;
        best = delimiter;
      }
    }
  }
  return best;
}

/** RFC 4180 parser: quoted fields, doubled quotes, and line breaks inside quotes. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field.trim() === "") {
      quoted = true;
      field = "";
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((cells) => cells.map((cell) => cell.trim())).filter((cells) => cells.some((cell) => cell !== ""));
}
