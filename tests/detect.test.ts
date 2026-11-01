import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/lib/csv";
import { DAY } from "../src/lib/dates";
import { analyze, cadenceOf, nextCharge } from "../src/lib/detect";
import { buildCalendar, foldLine } from "../src/lib/ics";
import { mergeTxns, pack, unpack } from "../src/lib/history";
import { displayName, findMerchant, merchantKey } from "../src/lib/merchants";
import { sampleStatement } from "../src/lib/sample";
import { findMapping, rowsToTxns, type Txn } from "../src/lib/table";

const d = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const txn = (iso: string, text: string, amount: number): Txn => ({ date: d(iso), text, amount });

describe("merchants", () => {
  it("drops reference codes so monthly lines group together", () => {
    expect(merchantKey("SPOTIFY P1B2C3D4 STOCKHOLM SE")).toBe(merchantKey("SPOTIFY X9Y8Z7W6 STOCKHOLM SE"));
    expect(merchantKey("IYZICO/FORMA SPOR SALONU ISTANBUL 4421")).toBe("iyzico forma");
    expect(merchantKey("A101 YENI MAGAZACILIK")).toBe("a101 yeni");
  });

  it("recognises known services", () => {
    expect(findMerchant("GOOGLE *YouTubePremium g.co/helppay#")?.id).toBe("youtube");
    expect(findMerchant("GOOGLE *Some Game")?.id).toBe("googleplay");
    expect(findMerchant("APPLE.COM/BILL ITUNES.COM")?.id).toBe("apple");
    expect(findMerchant("OPENAI *CHATGPT SUBSCR")?.id).toBe("chatgpt");
    expect(findMerchant("CANVAS SANAT ATÖLYESİ")).toBeUndefined();
  });

  it("makes a readable name from the original text", () => {
    expect(displayName("IYZICO/FORMA SPOR SALONU ISTANBUL TR 4421")).toBe("FORMA SPOR SALONU");
    expect(displayName("BRAINBOOST* APP")).toBe("BRAINBOOST APP");
  });
});

describe("cadence", () => {
  it("recognises schedules, including a missing month", () => {
    expect(cadenceOf([d("2026-05-05"), d("2026-06-05"), d("2026-07-06"), d("2026-08-04")])).toBe("monthly");
    expect(cadenceOf([d("2026-05-05"), d("2026-07-05"), d("2026-08-05")])).toBe("monthly");
    expect(cadenceOf([d("2026-09-01"), d("2026-09-08"), d("2026-09-15")])).toBe("weekly");
    expect(cadenceOf([d("2026-01-10"), d("2026-04-10"), d("2026-07-11")])).toBe("quarterly");
    expect(cadenceOf([d("2025-03-01"), d("2026-03-02")])).toBe("yearly");
    expect(cadenceOf([d("2026-09-01"), d("2026-09-04"), d("2026-10-20")])).toBeNull();
  });

  it("finds the next charge after the statement end", () => {
    expect(nextCharge(d("2026-10-05"), "monthly", d("2026-10-31"))).toBe(d("2026-11-05"));
    expect(nextCharge(d("2026-01-31"), "monthly", d("2026-02-10"))).toBe(d("2026-02-28"));
    expect(nextCharge(d("2026-10-01"), "weekly", d("2026-10-20"))).toBe(d("2026-10-22"));
  });
});

describe("analyze", () => {
  const months = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

  it("finds a price rise and ignores groceries", () => {
    const txns = [
      ...months.map((m, i) => txn(`${m}-05`, "NETFLIX.COM ISTANBUL", i < 4 ? 189.99 : 259.99)),
      ...months.map((m, i) => txn(`${m}-1${i}`, "MIGROS SANAL MARKET", 300 + i * 97)),
      ...months.map((m) => txn(`${m}-02`, "ODEME - TESEKKUR EDERIZ", -5000)),
    ];
    const result = analyze(txns);
    expect(result.subscriptions.map((sub) => sub.name)).toEqual(["Netflix"]);
    const netflix = result.subscriptions[0];
    expect(netflix.cadence).toBe("monthly");
    expect(netflix.amount).toBe(259.99);
    expect(netflix.changes).toHaveLength(1);
    expect(netflix.changes[0]).toMatchObject({ from: 189.99, to: 259.99 });
    expect(netflix.changes[0].pct).toBeCloseTo(0.368, 2);
    expect(result.yearly).toBeCloseTo(259.99 * 12, 2);
  });

  it("finds unknown subscriptions from their schedule and steady amount", () => {
    const txns = months.map((m) => txn(`${m}-01`, `IYZICO/FORMA SPOR SALONU ${Math.floor(Math.random() * 9000) + 1000}`, 1250));
    const [gym] = analyze(txns).subscriptions;
    expect(gym.name).toBe("FORMA SPOR SALONU");
    expect(gym.confidence).toBe("confirmed");
  });

  it("separates two subscriptions billed by the same store", () => {
    const txns = [
      ...months.map((m) => txn(`${m}-12`, "APPLE.COM/BILL", 39.99)),
      ...months.map((m) => txn(`${m}-20`, "APPLE.COM/BILL", 59.99)),
      txn("2026-08-23", "APPLE.COM/BILL", 149.99),
    ];
    const amounts = analyze(txns).subscriptions.map((sub) => sub.amount).sort();
    expect(amounts).toEqual([39.99, 59.99]);
  });

  it("marks foreign-currency billing as variable instead of reporting price changes", () => {
    const amounts = [812.4, 826.15, 839.9, 851.2, 866.75, 879.3];
    const [chatgpt] = analyze(months.map((m, i) => txn(`${m}-22`, "OPENAI *CHATGPT SUBSCR", amounts[i]))).subscriptions;
    expect(chatgpt.variable).toBe(true);
    expect(chatgpt.changes).toEqual([]);
  });

  it("flags new subscriptions and keeps cancelled ones apart", () => {
    const txns = [
      ...months.map((m) => txn(`${m}-15`, "MIGROS", 100 + Math.random() * 900)),
      txn("2026-10-08", "BRAINBOOST* APP", 149.9),
      txn("2026-10-15", "BRAINBOOST* APP", 149.9),
      txn("2026-10-22", "BRAINBOOST* APP", 149.9),
      ...months.slice(0, 3).map((m) => txn(`${m}-09`, "SPOTIFY", 99.99)),
    ];
    const result = analyze(txns);
    const brain = result.subscriptions.find((sub) => sub.name === "BRAINBOOST APP")!;
    expect(brain).toMatchObject({ cadence: "weekly", isNew: true });
    expect(result.stopped.map((sub) => sub.name)).toEqual(["Spotify"]);
  });

  it("lists a known service from a single statement and two-charge unknowns as possible", () => {
    const one = analyze([txn("2026-10-05", "NETFLIX.COM", 259.99), txn("2026-10-07", "MIGROS", 80)]);
    expect(one.subscriptions[0]).toMatchObject({ name: "Netflix", confidence: "likely", cadence: "monthly" });
    const two = analyze([txn("2026-09-03", "PIXELCLOUD STUDIO", 49), txn("2026-10-03", "PIXELCLOUD STUDIO", 49)]);
    expect(two.subscriptions).toEqual([]);
    expect(two.possible.map((sub) => sub.name)).toEqual(["PIXELCLOUD STUDIO"]);
  });

  it("detects everything planted in the sample statement", () => {
    for (const lang of ["tr", "en"] as const) {
      const rows = parseCsv(sampleStatement(lang, d("2026-11-01")));
      const result = analyze(rowsToTxns(rows, findMapping(rows)!, lang === "tr" ? "dmy" : "mdy"));
      const names = result.subscriptions.map((sub) => sub.name);
      for (const name of ["Netflix", "Spotify", "YouTube Premium", "ChatGPT", "Disney+", "BRAINBOOST APP", "Apple (App Store)"]) {
        expect(names).toContain(name);
      }
      expect(names.some((name) => /gym|spor/i.test(name))).toBe(true);
      expect(names).not.toContain("MIGROS SANAL MARKET");
      expect(result.subscriptions.find((sub) => sub.name === "Netflix")!.changes).toHaveLength(1);
      expect(result.subscriptions.find((sub) => sub.name === "BRAINBOOST APP")!.isNew).toBe(true);
    }
  });
});

describe("calendar", () => {
  it("builds valid recurring events with reminders", () => {
    const ics = buildCalendar(
      [{ uid: "netflix", date: d("2026-11-05"), summary: "Netflix renews, ₺259,99", cadence: "monthly", alarmDays: 2 }],
      d("2026-11-01"),
    );
    expect(ics).toContain("DTSTART;VALUE=DATE:20261105\r\n");
    expect(ics).toContain("RRULE:FREQ=MONTHLY\r\n");
    expect(ics).toContain("SUMMARY:Netflix renews\\, ₺259\\,99\r\n");
    expect(ics).toContain("TRIGGER:-P2D");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("folds long lines at 75 octets", () => {
    const folded = foldLine("SUMMARY:" + "ş".repeat(60));
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("history", () => {
  it("merges overlapping exports without losing genuine repeats", () => {
    const a = [txn("2026-10-01", "COFFEE", 3), txn("2026-10-01", "COFFEE", 3), txn("2026-10-05", "NETFLIX", 15.49)];
    const b = [txn("2026-10-05", "NETFLIX", 15.49), txn("2026-11-05", "NETFLIX", 15.49)];
    expect(mergeTxns(a, b)).toHaveLength(4);
    expect(mergeTxns(a, a)).toHaveLength(3);
  });

  it("round-trips through storage and ignores junk", () => {
    const txns = [txn("2026-10-05", "NETFLIX", 15.49), txn("2026-10-06", "SALARY", -2000)];
    expect(unpack(JSON.parse(JSON.stringify(pack(txns))))).toEqual([txns[0]]);
    expect(unpack([["x", 1, 2], "nope"])).toEqual([]);
    expect(unpack(null)).toEqual([]);
    expect(Date.UTC(2026, 9, 5) + DAY).toBe(d("2026-10-06"));
  });
});
