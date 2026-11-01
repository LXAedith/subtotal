import { addMonths, DAY } from "./dates";
import { displayName, findMerchant, isExcluded, merchantKey, type Category, type Merchant } from "./merchants";
import type { Txn } from "./table";

export type Cadence = "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "yearly";

interface CadenceRule {
  id: Cadence;
  days: number;
  /** Allowed drift in days: billing dates move with weekends, month lengths and posting delays. */
  tolerance: number;
  /** How many periods one gap may span, for a statement month that is missing from the upload. */
  maxSkip: number;
  perMonth: number;
  months?: number;
}

const CADENCES: CadenceRule[] = [
  { id: "weekly", days: 7, tolerance: 2, maxSkip: 2, perMonth: 52 / 12 },
  { id: "biweekly", days: 14, tolerance: 3, maxSkip: 2, perMonth: 26 / 12 },
  { id: "monthly", days: 30.44, tolerance: 5, maxSkip: 3, perMonth: 1, months: 1 },
  { id: "quarterly", days: 91.3, tolerance: 10, maxSkip: 1, perMonth: 1 / 3, months: 3 },
  { id: "semiannual", days: 182.6, tolerance: 14, maxSkip: 1, perMonth: 1 / 6, months: 6 },
  { id: "yearly", days: 365.25, tolerance: 20, maxSkip: 1, perMonth: 1 / 12, months: 12 },
];
const RULES = Object.fromEntries(CADENCES.map((rule) => [rule.id, rule])) as Record<Cadence, CadenceRule>;

export interface Charge {
  date: number;
  amount: number;
  text: string;
}

export interface PriceChange {
  date: number;
  from: number;
  to: number;
  /** +0.37 for a 37 % increase. */
  pct: number;
}

/** confirmed: repeats on a schedule · likely: a known service seen once · possible: worth a look. */
export type Confidence = "confirmed" | "likely" | "possible";

export interface Subscription {
  id: string;
  name: string;
  merchant?: Merchant;
  category: Category;
  cadence: Cadence;
  charges: Charge[];
  amount: number;
  monthly: number;
  yearly: number;
  next: number;
  active: boolean;
  confidence: Confidence;
  isNew: boolean;
  /** Amount moves a little every time: billed in a foreign currency or by usage. */
  variable: boolean;
  /** The same service billed more than once per period, e.g. two accounts. */
  twin: boolean;
  changes: PriceChange[];
}

export interface Analysis {
  /** Active, confirmed or likely: these make up the totals. */
  subscriptions: Subscription[];
  possible: Subscription[];
  stopped: Subscription[];
  start: number;
  end: number;
  /** Outgoing transactions that were looked at. */
  count: number;
  monthly: number;
  yearly: number;
}

interface Series {
  charges: Charge[];
  cadence: Cadence;
}

const days = (from: number, to: number) => Math.round((to - from) / DAY);

function fit(gap: number, rule: CadenceRule): number {
  const skip = Math.max(1, Math.round(gap / rule.days));
  if (skip > rule.maxSkip) return 0;
  return Math.abs(gap - skip * rule.days) <= rule.tolerance * (skip === 1 ? 1 : 1.5) ? skip : 0;
}

/** The schedule that explains the gaps best; one irregular gap in four is forgiven. */
export function cadenceOf(dates: number[]): Cadence | null {
  const gaps = dates.slice(1).map((date, i) => days(dates[i], date));
  if (!gaps.length) return null;
  let best: { id: Cadence; share: number; exact: number } | null = null;
  for (const rule of CADENCES) {
    const skips = gaps.map((gap) => fit(gap, rule));
    const share = skips.filter(Boolean).length / gaps.length;
    const exact = skips.filter((skip) => skip === 1).length;
    if (share < (gaps.length >= 3 ? 0.75 : 1) || exact === 0) continue;
    if (!best || share > best.share || (share === best.share && exact > best.exact)) best = { id: rule.id, share, exact };
  }
  return best?.id ?? null;
}

const ratio = (a: number, b: number) => b / a - 1;

/** Groceries at the same shop never cost the same twice; subscriptions mostly do. */
function steadyAmounts(amounts: number[]): boolean {
  const changes = amounts.slice(1).map((amount, i) => ratio(amounts[i], amount));
  if (changes.some((change) => Math.abs(change) > 0.4)) return false;
  return changes.filter((change) => Math.abs(change) <= 0.05).length / changes.length >= 0.6;
}

function evaluate(charges: Charge[], known: boolean): Series | null {
  if (charges.length < 2) return null;
  const cadence = cadenceOf(charges.map((charge) => charge.date));
  if (!cadence || (!known && !steadyAmounts(charges.map((charge) => charge.amount)))) return null;
  return { charges, cadence };
}

function clusterByAmount(charges: Charge[]): Charge[][] {
  const sorted = [...charges].sort((a, b) => a.amount - b.amount);
  const clusters: Charge[][] = [];
  for (const charge of sorted) {
    const current = clusters.at(-1);
    if (current && charge.amount <= current[0].amount * 1.15) current.push(charge);
    else clusters.push([charge]);
  }
  return clusters.map((cluster) => cluster.sort((a, b) => a.date - b.date));
}

/** Two amount clusters that follow each other on schedule are one subscription with a price change. */
function mergeSequential(list: Series[]): Series[] {
  const sorted = [...list].sort((a, b) => a.charges[0].date - b.charges[0].date);
  const result: Series[] = [];
  for (const series of sorted) {
    const previous = result.find((candidate) => {
      const last = candidate.charges.at(-1)!;
      const first = series.charges[0];
      return (
        candidate.cadence === series.cadence &&
        last.date < first.date &&
        fit(days(last.date, first.date), RULES[series.cadence]) === 1 &&
        Math.abs(ratio(last.amount, first.amount)) <= 0.6
      );
    });
    if (previous) previous.charges.push(...series.charges);
    else result.push({ charges: [...series.charges], cadence: series.cadence });
  }
  return result;
}

function seriesOf(charges: Charge[], known: boolean): Series[] {
  const whole = evaluate(charges, known);
  if (whole) return [whole];
  const clusters = clusterByAmount(charges);
  if (clusters.length < 2) return [];
  return mergeSequential(clusters.map((cluster) => evaluate(cluster, known)).filter((series) => series !== null));
}

export function nextCharge(last: number, cadence: Cadence, after: number): number {
  const rule = RULES[cadence];
  let next = last;
  do {
    next = rule.months ? addMonths(next, rule.months) : next + rule.days * DAY;
  } while (next <= after);
  return next;
}

function priceChanges(charges: Charge[]): { variable: boolean; changes: PriceChange[] } {
  const amounts = charges.map((charge) => charge.amount);
  const moves = amounts.slice(1).map((amount, i) => ratio(amounts[i], amount));
  const variable = amounts.length >= 3 && moves.filter((move) => Math.abs(move) > 0.01).length >= moves.length / 2;
  if (variable) return { variable, changes: [] };
  const changes: PriceChange[] = [];
  moves.forEach((move, i) => {
    if (Math.abs(move) < 0.03) return;
    // A one-off blip (partial refund, pro-rated month) that goes straight back is not a price change.
    const after = amounts[i + 2];
    if (after !== undefined && Math.abs(ratio(amounts[i], after)) < 0.03) return;
    changes.push({ date: charges[i + 1].date, from: amounts[i], to: amounts[i + 1], pct: move });
  });
  return { variable, changes };
}

function build(
  id: string,
  charges: Charge[],
  cadence: Cadence,
  merchant: Merchant | undefined,
  confidence: Confidence,
  range: { start: number; end: number },
): Subscription {
  const rule = RULES[cadence];
  const first = charges[0];
  const last = charges.at(-1)!;
  const { variable, changes } = priceChanges(charges);
  return {
    id,
    name: merchant && !merchant.generic ? merchant.name : displayName(last.text),
    merchant,
    category: merchant?.category ?? "other",
    cadence,
    charges,
    amount: last.amount,
    monthly: last.amount * rule.perMonth,
    yearly: last.amount * rule.perMonth * 12,
    next: nextCharge(last.date, cadence, range.end),
    active: range.end - last.date <= (rule.days * 1.5 + 3) * DAY,
    confidence,
    // Only "new" when earlier statements were uploaded and did not have it.
    isNew: first.date - range.start >= 45 * DAY && range.end - first.date <= 45 * DAY,
    variable,
    twin: false,
    changes,
  };
}

export function analyze(txns: Txn[]): Analysis {
  const outgoing = txns.filter((txn) => txn.amount > 0 && !isExcluded(txn.text));
  if (!txns.length) return { subscriptions: [], possible: [], stopped: [], start: 0, end: 0, count: 0, monthly: 0, yearly: 0 };
  const start = Math.min(...txns.map((txn) => txn.date));
  const end = Math.max(...txns.map((txn) => txn.date));
  const range = { start, end };

  const groups = new Map<string, { merchant?: Merchant; charges: Charge[] }>();
  for (const txn of outgoing) {
    const merchant = findMerchant(txn.text);
    const key = merchant && !merchant.generic ? `m:${merchant.id}` : `k:${merchantKey(txn.text)}`;
    const group = groups.get(key) ?? { merchant, charges: [] };
    group.charges.push({ date: txn.date, amount: Math.round(txn.amount * 100) / 100, text: txn.text });
    groups.set(key, group);
  }

  const all: Subscription[] = [];
  for (const [key, { merchant, charges }] of groups) {
    charges.sort((a, b) => a.date - b.date);
    const found = seriesOf(charges, merchant !== undefined).map((series, i) =>
      build(`${key}|${i}`, series.charges, series.cadence, merchant, merchant || series.charges.length >= 3 ? "confirmed" : "possible", range),
    );
    if (merchant?.strong && found.filter((sub) => sub.active).length > 1) {
      for (const sub of found) if (sub.active) sub.twin = true;
    }
    if (!found.some((sub) => sub.active) && merchant) {
      // Known service, but no schedule yet. With one statement it is assumed monthly; when two or more
      // months were uploaded and it still showed up once, a yearly plan is the better guess.
      const last = charges.at(-1)!;
      const missedAMonth = end - start >= 60 * DAY && end - last.date > 35 * DAY;
      const cadence = missedAMonth ? "yearly" : "monthly";
      const single = build(`${key}|single`, [last], cadence, merchant, merchant.strong ? "likely" : "possible", range);
      if (single.active) found.push(single);
    }
    all.push(...found);
  }

  const byYearly = (a: Subscription, b: Subscription) => b.yearly - a.yearly;
  const subscriptions = all.filter((sub) => sub.active && sub.confidence !== "possible").sort(byYearly);
  const monthly = subscriptions.reduce((sum, sub) => sum + sub.monthly, 0);
  return {
    subscriptions,
    possible: all.filter((sub) => sub.active && sub.confidence === "possible").sort(byYearly),
    stopped: all.filter((sub) => !sub.active && sub.confidence === "confirmed").sort((a, b) => b.next - a.next),
    start,
    end,
    count: outgoing.length,
    monthly,
    yearly: monthly * 12,
  };
}
