import { describe, expect, it } from "vitest";
import { inferDecimal, parseAmount } from "../src/lib/amount";
import { detectDelimiter, parseCsv } from "../src/lib/csv";
import { addMonths, inferDateOrder, isoDate, parseDate } from "../src/lib/dates";
import { linesToTxns } from "../src/lib/lines";
import { findMapping, rowsToTxns } from "../src/lib/table";
import { decodeText, fold } from "../src/lib/text";

describe("text", () => {
  it("folds Turkish letters", () => {
    expect(fold("İşlem Tarihi")).toBe("islem tarihi");
    expect(fold("AÇIKLAMA")).toBe("aciklama");
    expect(fold("Borç")).toBe("borc");
  });

  it("decodes UTF-8, UTF-16 and Windows-1254", () => {
    expect(decodeText(new TextEncoder().encode("Açıklama"))).toBe("Açıklama");
    expect(decodeText(new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x15, 0x01]))).toBe("Aĕ");
    // "Ödeme" in Windows-1254: Ö = 0xD6
    expect(decodeText(new Uint8Array([0xd6, 0x64, 0x65, 0x6d, 0x65, 0x20, 0xfe]))).toBe("Ödeme ş");
  });
});

describe("csv", () => {
  it("detects the delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2,5;3\n4;5,5;6")).toBe(";");
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("handles quotes, doubled quotes and line breaks", () => {
    expect(parseCsv('date,text,amount\n2026-01-01,"Shop, Inc ""A""",-1,50\n', ",")).toEqual([
      ["date", "text", "amount"],
      ["2026-01-01", 'Shop, Inc "A"', "-1", "50"],
    ]);
    expect(parseCsv('a;"two\nlines";c\r\n1;2;3', ";")).toEqual([
      ["a", "two\nlines", "c"],
      ["1", "2", "3"],
    ]);
  });
});

describe("amounts", () => {
  it("parses Turkish, US and accounting formats", () => {
    expect(parseAmount("1.234,56 TL")).toBe(1234.56);
    expect(parseAmount("-259,99")).toBe(-259.99);
    expect(parseAmount("259,99-")).toBe(-259.99);
    expect(parseAmount("(17.99)")).toBe(-17.99);
    expect(parseAmount("$1,234.56")).toBe(1234.56);
    expect(parseAmount("₺ 1 250,00")).toBe(1250);
    expect(parseAmount("+500")).toBe(500);
    expect(parseAmount("1,234")).toBe(1234);
  });

  it("rejects non-numbers", () => {
    expect(parseAmount("NETFLIX")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("1/6")).toBeNull();
    expect(parseAmount("12,")).toBeNull();
  });

  it("uses the column's decimal separator for ambiguous values", () => {
    expect(inferDecimal(["1.250", "259,99", "39,99"])).toBe(",");
    expect(inferDecimal(["1,250", "259.99"])).toBe(".");
    expect(parseAmount("1.250", ",")).toBe(1250);
    expect(parseAmount("12.50", ".")).toBe(12.5);
  });
});

describe("dates", () => {
  it("parses common formats", () => {
    expect(isoDate(parseDate("05.10.2026")!)).toBe("2026-10-05");
    expect(isoDate(parseDate("2026-10-05 14:32")!)).toBe("2026-10-05");
    expect(isoDate(parseDate("05/10/26")!)).toBe("2026-10-05");
    expect(isoDate(parseDate("10/05/2026", "mdy")!)).toBe("2026-10-05");
    expect(isoDate(parseDate("5 Eki 2026")!)).toBe("2026-10-05");
    expect(isoDate(parseDate("05 Ağustos 2026")!)).toBe("2026-08-05");
    expect(isoDate(parseDate("Oct 5, 2026")!)).toBe("2026-10-05");
    expect(parseDate("31.02.2026")).toBeNull();
    expect(parseDate("NETFLIX")).toBeNull();
  });

  it("infers day/month order from days above 12", () => {
    expect(inferDateOrder(["10/05/2026", "10/28/2026"], "dmy")).toBe("mdy");
    expect(inferDateOrder(["28/10/2026", "05/10/2026"], "mdy")).toBe("dmy");
    expect(inferDateOrder(["01/02/2026"], "mdy")).toBe("mdy");
  });

  it("adds months without overflowing short months", () => {
    expect(isoDate(addMonths(Date.UTC(2026, 0, 31), 1))).toBe("2026-02-28");
    expect(isoDate(addMonths(Date.UTC(2026, 10, 15), 2))).toBe("2027-01-15");
  });
});

describe("tables", () => {
  it("reads a Turkish card export with a title block above the header", () => {
    const rows = [
      ["Kart Hesap Hareketleri"],
      ["Müşteri", "****1234"],
      ["İşlem Tarihi", "Açıklama", "Bonus", "Tutar"],
      ["05.10.2026", "NETFLIX.COM ISTANBUL TR", "0,52", "259,99"],
      ["14.10.2026", "ÖDEME - TEŞEKKÜR EDERİZ", "", "-9.800,00"],
      ["17.10.2026", "MIGROS", "1,20", "1.234,50"],
    ];
    const mapping = findMapping(rows)!;
    expect(mapping).toMatchObject({ headerRow: 2, date: 0, text: 1, amount: 3 });
    const txns = rowsToTxns(rows, mapping, "dmy");
    expect(txns.map((txn) => txn.amount)).toEqual([259.99, -9800, 1234.5]);
  });

  it("reads a bank account export with debit and credit columns", () => {
    const rows = [
      ["Date", "Description", "Paid out", "Paid in", "Balance"],
      ["10/05/2026", "SPOTIFY", "11.99", "", "1,000.00"],
      ["10/28/2026", "SALARY", "", "2,500.00", "3,488.01"],
    ];
    const mapping = findMapping(rows)!;
    expect(mapping).toMatchObject({ date: 0, text: 1, debit: 2, credit: 3 });
    expect(rowsToTxns(rows, mapping, "dmy")).toEqual([
      { date: Date.UTC(2026, 9, 5), text: "SPOTIFY", amount: 11.99 },
      { date: Date.UTC(2026, 9, 28), text: "SALARY", amount: -2500 },
    ]);
  });

  it("flips the sign when money out is negative", () => {
    const rows = [
      ["Tarih", "Açıklama", "Tutar", "Bakiye"],
      ["01.10.2026", "MAAŞ", "40.000,00", "41.000,00"],
      ["05.10.2026", "NETFLIX", "-259,99", "40.740,01"],
      ["06.10.2026", "MARKET", "-500,00", "40.240,01"],
    ];
    const txns = rowsToTxns(rows, findMapping(rows)!, "dmy");
    expect(txns.map((txn) => txn.amount)).toEqual([-40000, 259.99, 500]);
  });

  it("uses a B/A side column", () => {
    const rows = [
      ["Tarih", "Açıklama", "Tutar", "B/A"],
      ["05.10.2026", "NETFLIX", "259,99", "B"],
      ["06.10.2026", "IADE", "50,00", "A"],
    ];
    const mapping = findMapping(rows)!;
    expect(mapping.side).toBe(3);
    expect(rowsToTxns(rows, mapping, "dmy").map((txn) => txn.amount)).toEqual([259.99, -50]);
  });

  it("guesses columns when there is no header", () => {
    const rows = [
      ["2026-10-05", "NETFLIX.COM", "15.49", "984.51"],
      ["2026-10-06", "WHOLE FOODS MARKET", "54.20", "930.31"],
      ["2026-10-09", "SPOTIFY USA", "11.99", "918.32"],
    ];
    expect(findMapping(rows)).toMatchObject({ headerRow: -1, date: 0, text: 1, amount: 2 });
  });
});

describe("lines", () => {
  it("reads PDF-style statement lines", () => {
    const lines = [
      "Hesap Kesim Tarihi 31.10.2026",
      "05.10.2026 NETFLIX.COM ISTANBUL TR 259,99 0,52",
      "06.10.2026 06.10.2026 TRENDYOL 1/6 1.200,00",
      "14.10.2026 ÖDEME - TEŞEKKÜR EDERİZ -9.800,00",
      "Dönem Borcu Toplamı 1.459,99",
      "17.10.2026 A101 12 89,90",
    ];
    expect(linesToTxns(lines, "dmy")).toEqual([
      { date: Date.UTC(2026, 9, 5), text: "NETFLIX.COM ISTANBUL TR", amount: 259.99 },
      { date: Date.UTC(2026, 9, 6), text: "TRENDYOL 1/6", amount: 1200 },
      { date: Date.UTC(2026, 9, 14), text: "ÖDEME - TEŞEKKÜR EDERİZ", amount: -9800 },
      { date: Date.UTC(2026, 9, 17), text: "A101 12", amount: 89.9 },
    ]);
  });
});
