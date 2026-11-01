import type { Cadence } from "./detect";

export interface CalendarEvent {
  uid: string;
  date: number;
  summary: string;
  description?: string;
  cadence?: Cadence;
  /** Reminder this many days before the event. */
  alarmDays?: number;
}

const RRULE: Record<Cadence, string> = {
  weekly: "FREQ=WEEKLY",
  biweekly: "FREQ=WEEKLY;INTERVAL=2",
  monthly: "FREQ=MONTHLY",
  quarterly: "FREQ=MONTHLY;INTERVAL=3",
  semiannual: "FREQ=MONTHLY;INTERVAL=6",
  yearly: "FREQ=YEARLY",
};

const compact = (time: number) => new Date(time).toISOString().slice(0, 10).replaceAll("-", "");

export function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** RFC 5545 lines are at most 75 octets; longer ones continue on the next line after a space. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    if (encoder.encode(current + char).length > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = char;
    } else current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildCalendar(events: CalendarEvent[], now = Date.now()): string {
  const stamp = new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Subtotal//Subscription reminders//EN", "CALSCALE:GREGORIAN"];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}@subtotal`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.date)}`,
      `DTEND;VALUE=DATE:${compact(event.date + 86_400_000)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.cadence) lines.push(`RRULE:${RRULE[event.cadence]}`);
    lines.push("TRANSP:TRANSPARENT");
    if (event.alarmDays) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(event.summary)}`, `TRIGGER:-P${event.alarmDays}D`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
