import { addMonths, DAY } from "./dates";

type Lang = "en" | "tr";

interface Line {
  date: number;
  text: string;
  amount: number;
}

/** Small seeded generator so the sample looks the same on every visit. */
function random(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUBSCRIPTIONS: Record<Lang, { day: number; text: string | ((r: () => number) => string); amounts: number[] }[]> = {
  tr: [
    { day: 5, text: "NETFLIX.COM ISTANBUL TR", amounts: [189.99, 189.99, 189.99, 189.99, 259.99, 259.99] },
    { day: 9, text: (r) => `SPOTIFY P${Math.floor(r() * 9e6)} STOCKHOLM SE`, amounts: [99.99] },
    { day: 12, text: "APPLE.COM/BILL ITUNES.COM IE", amounts: [39.99] },
    { day: 17, text: "GOOGLE *YouTubePremium g.co/helppay#", amounts: [79.99] },
    { day: 22, text: "OPENAI *CHATGPT SUBSCR SAN FRANCISCO US", amounts: [812.4, 826.15, 839.9, 851.2, 866.75, 879.3] },
    { day: 1, text: "IYZICO/FORMA SPOR SALONU ISTANBUL", amounts: [1250] },
    { day: 26, text: "TURKCELL FATURA ODEME", amounts: [455.3, 455.3, 472.1, 472.1, 489, 489] },
  ],
  en: [
    { day: 5, text: "NETFLIX.COM LOS GATOS CA", amounts: [15.49, 15.49, 15.49, 15.49, 17.99, 17.99] },
    { day: 9, text: (r) => `SPOTIFY P${Math.floor(r() * 9e6)} NEW YORK NY`, amounts: [11.99] },
    { day: 12, text: "APPLE.COM/BILL 866-712-7753 CA", amounts: [2.99] },
    { day: 17, text: "GOOGLE *YouTubePremium g.co/helppay#", amounts: [13.99] },
    { day: 22, text: "OPENAI *CHATGPT SUBSCR SAN FRANCISCO CA", amounts: [20] },
    { day: 1, text: "IRONWORKS GYM MEMBERSHIP", amounts: [39] },
    { day: 26, text: "VERIZON WIRELESS PAYMENT", amounts: [65.0, 65.0, 65.0, 68.5, 68.5, 68.5] },
  ],
};

const SHOPPING: Record<Lang, { text: string; min: number; max: number; perMonth: number }[]> = {
  tr: [
    { text: "MIGROS SANAL MARKET ISTANBUL", min: 320, max: 1450, perMonth: 4 },
    { text: "A101 YENI MAGAZACILIK", min: 85, max: 420, perMonth: 3 },
    { text: "SHELL PETROL ISTANBUL", min: 900, max: 1900, perMonth: 2 },
    { text: "YEMEKSEPETI ISTANBUL", min: 180, max: 640, perMonth: 3 },
    { text: "TRENDYOL.COM", min: 150, max: 2400, perMonth: 2 },
    { text: "STARBUCKS KADIKOY", min: 95, max: 260, perMonth: 3 },
    { text: "ECZANE ISTANBUL", min: 60, max: 480, perMonth: 1 },
  ],
  en: [
    { text: "WHOLEFDS MKT #10234", min: 24, max: 140, perMonth: 4 },
    { text: "TRADER JOE'S #552", min: 18, max: 95, perMonth: 3 },
    { text: "SHELL OIL 57444", min: 30, max: 70, perMonth: 2 },
    { text: "UBER *EATS", min: 16, max: 48, perMonth: 3 },
    { text: "AMAZON MKTPL*2K4L1", min: 9, max: 160, perMonth: 3 },
    { text: "STARBUCKS STORE 08812", min: 4, max: 14, perMonth: 4 },
    { text: "CVS/PHARMACY #0412", min: 6, max: 60, perMonth: 1 },
  ],
};

/**
 * A made-up card statement covering the last six months: a price rise, a new weekly trial, a service billed
 * in dollars and the usual groceries around them. Goes through the same parser as a real file.
 */
export function sampleStatement(lang: Lang, today = Date.now()): string {
  const r = random(42);
  const now = new Date(today);
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const firstMonth = addMonths(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1), -5);
  const lines: Line[] = [];
  const add = (date: number, text: string, amount: number) => {
    if (date <= end && date >= end - 190 * DAY) lines.push({ date, text, amount: Math.round(amount * 100) / 100 });
  };

  for (let i = 0; i < 6; i++) {
    const month = addMonths(firstMonth, i);
    for (const sub of SUBSCRIPTIONS[lang]) {
      const text = typeof sub.text === "string" ? sub.text : sub.text(r);
      add(month + (sub.day - 1) * DAY, text, sub.amounts[Math.min(i, sub.amounts.length - 1)]);
    }
    for (const shop of SHOPPING[lang]) {
      for (let n = 0; n < shop.perMonth; n++) add(month + Math.floor(r() * 28) * DAY, shop.text, shop.min + r() * (shop.max - shop.min));
    }
    add(month + 14 * DAY, lang === "tr" ? "ÖDEME - TEŞEKKÜR EDERİZ" : "PAYMENT - THANK YOU", lang === "tr" ? -9800 : -1250);
  }
  // Two things that started recently: a weekly app trial that turned paid, and a new streaming service.
  for (let week = 3; week >= 1; week--) add(end - (week * 7 - 2) * DAY, "BRAINBOOST* APP", lang === "tr" ? 149.9 : 6.99);
  add(end - 11 * DAY, "DISNEY PLUS", lang === "tr" ? 349.9 : 9.99);
  add(addMonths(firstMonth, 2) + 19 * DAY, "APPLE.COM/BILL ITUNES.COM IE", lang === "tr" ? 149.99 : 4.99);

  lines.sort((a, b) => a.date - b.date);
  const date = (time: number) => {
    const d = new Date(time);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    return lang === "tr" ? `${dd}.${mm}.${d.getUTCFullYear()}` : `${mm}/${dd}/${d.getUTCFullYear()}`;
  };
  if (lang === "tr") {
    const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return ["İşlem Tarihi;Açıklama;Tutar (TL)", ...lines.map((l) => `${date(l.date)};${l.text};${money(l.amount)}`)].join("\n");
  }
  const quote = (s: string) => (/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return ["Date,Description,Amount", ...lines.map((l) => `${date(l.date)},${quote(l.text)},${l.amount.toFixed(2)}`)].join("\n");
}
