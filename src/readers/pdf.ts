import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ReadError } from "./errors";

GlobalWorkerOptions.workerSrc = workerUrl;

interface Piece {
  x: number;
  y: number;
  text: string;
}

/**
 * The text of a PDF statement as lines. PDF text has no lines, only positioned pieces, so pieces whose
 * baselines are within a few points are joined left to right.
 */
export async function pdfLines(data: Uint8Array, password?: string): Promise<string[]> {
  const task = getDocument({ data, password, useSystemFonts: true, disableFontFace: true, verbosity: 0 });
  let doc;
  try {
    doc = await task.promise;
  } catch (error) {
    if ((error as { name?: string }).name === "PasswordException") throw new ReadError(password ? "password_wrong" : "password");
    throw new ReadError("broken");
  }
  const lines: string[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const pieces: Piece[] = [];
      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        pieces.push({ x: item.transform[4], y: item.transform[5], text: item.str });
      }
      pieces.sort((a, b) => b.y - a.y || a.x - b.x);
      let row: Piece[] = [];
      const flush = () => {
        if (row.length) lines.push(row.sort((a, b) => a.x - b.x).map((piece) => piece.text.trim()).join(" "));
        row = [];
      };
      for (const piece of pieces) {
        if (row.length && Math.abs(row[0].y - piece.y) > 3) flush();
        row.push(piece);
      }
      flush();
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  if (lines.join("").length < 40) throw new ReadError("scanned");
  return lines;
}
