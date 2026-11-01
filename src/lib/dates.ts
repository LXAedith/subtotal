import { fold } from "./text";

export type DateOrder = "dmy" | "mdy";

export const DAY = 86_400_000;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, oca: 1, ocak: 1,
  feb: 2, february: 2, sub: 2, subat: 2,
  mar: 3, march: 3, mart: 3,
  apr: 4, april: 4, nis: 4, nisan: 4,
  may: 5, mayis: 5,
  jun: 6, june: 6, haz: 6, haziran: 6,
  jul: 7, july: 7, tem: 7, temmuz: 7,
  aug: 8, august: 8, agu: 8, agustos: 8,
  sep: 9, sept: 9, september: 9, eyl: 9, eylul: 9,
  oct: 10, october: 10, eki: 10, ekim: 10,
  nov: 11, november: 11, kas: 11, kasim: 11,
  dec: 12, december: 12, ara: 12, aralik: 12,
};

const ISO = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?=$|[\sT])/;
// The separator is captured: dotted dates (05.10.2026) are always day first, slashes depend on the country.
const NUMERIC = /^(\d{1,2})([./-])(\d{1,2})\2(\d{4}|\d{2})(?=$|[\sT])/;
const DAY_NAME = /^(\d{1,2})[\s./-]+([a-z]{3,9})\.?[\s./,-]+(\d{4})(?=$|\s)/;
const NAME_DAY = /^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})(?=$|\s)/;

/** Matches a date at the very start of the text. Returns UTC midnight in ms and the matched length. */
export function matchDate(raw: string, order: DateOrder = "dmy"): { time: number; length: number } | null {
  const text = fold(raw.trimStart());
  const offset = raw.length - raw.trimStart().length;
  let m = ISO.exec(text);
  if (m) return build(+m[1], +m[2], +m[3], m[0].length + offset);
  m = NUMERIC.exec(text);
  if (m) {
    const year = m[4].length === 2 ? 2000 + +m[4] : +m[4];
    let [day, month] = order === "dmy" || m[2] === "." ? [+m[1], +m[3]] : [+m[3], +m[1]];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    return build(year, month, day, m[0].length + offset);
  }
  m = DAY_NAME.exec(text);
  if (m && MONTHS[m[2]]) return build(+m[3], MONTHS[m[2]], +m[1], m[0].length + offset);
  m = NAME_DAY.exec(text);
  if (m && MONTHS[m[1]]) return build(+m[3], MONTHS[m[1]], +m[2], m[0].length + offset);
  return null;
}

export function parseDate(raw: string, order: DateOrder = "dmy"): number | null {
  return matchDate(raw, order)?.time ?? null;
}

function build(year: number, month: number, day: number, length: number): { time: number; length: number } | null {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
  const time = Date.UTC(year, month - 1, day);
  if (new Date(time).getUTCDate() !== day) return null;
  return { time, length };
}

/** "05/10/2026" is 5 October in Turkey and 10 May in the US: look for a day above 12 to decide. */
export function inferDateOrder(values: string[], fallback: DateOrder): DateOrder {
  let dmy = 0;
  let mdy = 0;
  for (const value of values) {
    const m = NUMERIC.exec(fold(value.trim()));
    if (!m) continue;
    if (+m[1] > 12 || m[2] === ".") dmy++;
    else if (+m[3] > 12) mdy++;
  }
  if (dmy > mdy) return "dmy";
  if (mdy > dmy) return "mdy";
  return fallback;
}

/** Adds whole months, keeping the day of month where possible (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(time: number, months: number): number {
  const date = new Date(time);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDay));
}

export function isoDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}
