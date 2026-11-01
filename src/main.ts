import "./styles.css";
import { REPO_URL, SITE_URL } from "./config";
import { getLang, locale, plural, setLang, t, type Key } from "./i18n";
import { icon, type IconName } from "./icons";
import { CURRENCIES, currencyForLocale, type Currency } from "./lib/currency";
import { DAY, type DateOrder } from "./lib/dates";
import { analyze, type Analysis, type Cadence, type Subscription } from "./lib/detect";
import { mergeTxns, pack, trimHistory, unpack } from "./lib/history";
import { buildCalendar, type CalendarEvent } from "./lib/ics";
import { sampleStatement } from "./lib/sample";
import { parseCsv } from "./lib/csv";
import { findMapping, rowsToTxns, type Mapping, type Txn } from "./lib/table";
import { fromMapping, ReadError, readFile, readText, type ReadResult } from "./readers";

type Decision = "keep" | "cancel" | "hide" | "add";

const KEYS = {
  history: "subtotal:history",
  remember: "subtotal:remember",
  decisions: "subtotal:decisions",
  currency: "subtotal:currency",
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const els = {
  hero: $("hero"),
  start: $("start"),
  drop: $("drop"),
  input: $<HTMLInputElement>("file-input"),
  sample: $<HTMLButtonElement>("sample"),
  pasteToggle: $<HTMLButtonElement>("paste-toggle"),
  pasteBox: $("paste-box"),
  paste: $<HTMLTextAreaElement>("paste"),
  pasteGo: $<HTMLButtonElement>("paste-go"),
  status: $("status"),
  results: $("results"),
  lang: $<HTMLButtonElement>("lang"),
  install: $<HTMLButtonElement>("install"),
  passwordDialog: $<HTMLDialogElement>("password-dialog"),
  passwordForm: $<HTMLFormElement>("password-form"),
  passwordInput: $<HTMLInputElement>("password-input"),
  passwordName: $("password-name"),
  columnsDialog: $<HTMLDialogElement>("columns-dialog"),
  columnsForm: $<HTMLFormElement>("columns-form"),
  columnsText: $("columns-text"),
  columnsPreview: $("columns-preview"),
  colDate: $<HTMLSelectElement>("col-date"),
  colText: $<HTMLSelectElement>("col-text"),
  colAmount: $<HTMLSelectElement>("col-amount"),
};

// ---------- storage (every access may throw in private mode) ----------

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: Subtotal still works, it just won't remember
  }
}

const state = {
  txns: [] as Txn[],
  analysis: undefined as Analysis | undefined,
  sample: false,
  welcome: false,
  remember: load<"yes" | "no" | null>(KEYS.remember, null),
  decisions: load<Record<string, Decision>>(KEYS.decisions, {}),
  currency: load<Currency | null>(KEYS.currency, null) ?? currencyForLocale(navigator.language),
  busy: false,
  askRemember: false,
  messages: [] as { kind: "error" | "info"; text: string }[],
  animateTotal: true,
};

// ---------- formatting ----------

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function money(amount: number, whole = false): string {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: state.currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

const totalMoney = (amount: number) => money(amount, amount >= 100);

function shortDate(time: number, withYear = false): string {
  return new Intl.DateTimeFormat(locale(), {
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(time);
}

function percent(value: number): string {
  return new Intl.NumberFormat(locale(), { style: "percent", maximumFractionDigits: 0 }).format(Math.abs(value));
}

const cadenceLabel = (cadence: Cadence) => t(`cad_${cadence}` as Key);
const perLabel = (cadence: Cadence) => t(`per_${cadence}` as Key);

function titleCase(name: string): string {
  // "FORMA SPOR SALONU" reads better as "Forma Spor Salonu"; names with lower case letters are left alone.
  if (name !== name.toUpperCase()) return name;
  // Banks often drop Turkish letters ("KITAPKULUBU"): Turkish rules would lower-case that I to "ı".
  const lang = /[İŞĞ]/.test(name) ? "tr-TR" : "en-US";
  return name
    .toLocaleLowerCase(lang)
    .replace(/(^|[\s.-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase(lang));
}

const nameOf = (sub: Subscription) => (sub.merchant && !sub.merchant.generic ? sub.name : titleCase(sub.name));

function hueOf(text: string): number {
  let hash = 0;
  for (const c of text) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return hash % 360;
}

function dateOrder(): DateOrder {
  return getLang() === "en" && navigator.language === "en-US" ? "mdy" : "dmy";
}

// ---------- reading ----------

function setStatus(text: string): void {
  els.status.innerHTML = text ? `<p class="working"><span class="spinner" aria-hidden="true"></span>${escapeHtml(text)}</p>` : "";
}

function askPassword(name: string, wrong: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    els.passwordName.textContent = wrong ? t("err_password_wrong", { name }) : name;
    els.passwordInput.value = "";
    const done = (value: string | null) => {
      els.passwordForm.onsubmit = null;
      $("password-cancel").onclick = null;
      els.passwordDialog.onclose = null;
      if (els.passwordDialog.open) els.passwordDialog.close();
      resolve(value);
    };
    els.passwordForm.onsubmit = (event) => {
      event.preventDefault();
      done(els.passwordInput.value);
    };
    $("password-cancel").onclick = () => done(null);
    els.passwordDialog.onclose = () => done(null);
    els.passwordDialog.showModal();
    els.passwordInput.focus();
  });
}

function askColumns(name: string, rows: string[][]): Promise<Mapping | null> {
  return new Promise((resolve) => {
    const preview = rows.slice(0, 8);
    const width = Math.max(...preview.map((row) => row.length));
    els.columnsText.textContent = t("columns_text", { name });
    els.columnsPreview.innerHTML = `<table><tbody>${preview
      .map((row) => `<tr>${Array.from({ length: width }, (_, c) => `<td>${escapeHtml(row[c] ?? "")}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
    const options = Array.from({ length: width }, (_, c) => {
      const example = rows.find((row) => row[c])?.[c] ?? "";
      return `<option value="${c}">${escapeHtml(t("col_none", { n: c + 1 }))}${example ? ` · ${escapeHtml(example.slice(0, 24))}` : ""}</option>`;
    }).join("");
    for (const select of [els.colDate, els.colText, els.colAmount]) select.innerHTML = options;
    els.colDate.value = "0";
    els.colText.value = String(Math.min(1, width - 1));
    els.colAmount.value = String(Math.min(2, width - 1));
    const done = (value: Mapping | null) => {
      els.columnsForm.onsubmit = null;
      $("columns-cancel").onclick = null;
      els.columnsDialog.onclose = null;
      if (els.columnsDialog.open) els.columnsDialog.close();
      resolve(value);
    };
    els.columnsForm.onsubmit = (event) => {
      event.preventDefault();
      done({ headerRow: -1, date: +els.colDate.value, text: +els.colText.value, amount: +els.colAmount.value });
    };
    $("columns-cancel").onclick = () => done(null);
    els.columnsDialog.onclose = () => done(null);
    els.columnsDialog.showModal();
  });
}

async function readOne(file: File): Promise<ReadResult | null> {
  let password: string | undefined;
  for (;;) {
    try {
      return await readFile(file, dateOrder(), password);
    } catch (error) {
      if (!(error instanceof ReadError)) {
        console.error(error);
        state.messages.push({ kind: "error", text: t("err_broken", { name: file.name }) });
        return null;
      }
      if (error.code === "password" || error.code === "password_wrong") {
        const entered = await askPassword(file.name, error.code === "password_wrong");
        if (entered === null) {
          state.messages.push({ kind: "error", text: t("err_password", { name: file.name }) });
          return null;
        }
        password = entered;
        continue;
      }
      if (error.code === "columns" && error.rows) {
        const mapping = await askColumns(file.name, error.rows);
        if (!mapping) {
          state.messages.push({ kind: "error", text: t("err_columns", { name: file.name }) });
          return null;
        }
        try {
          return fromMapping(error.rows, mapping, dateOrder());
        } catch {
          state.messages.push({ kind: "error", text: t("err_empty", { name: file.name }) });
          return null;
        }
      }
      state.messages.push({ kind: "error", text: t(`err_${error.code}` as Key, { name: file.name }) });
      return null;
    }
  }
}

function addResults(results: ReadResult[]): void {
  const found = results.flatMap((result) => result.txns);
  if (!found.length) return;
  if (state.sample) {
    state.txns = [];
    state.sample = false;
  }
  const detected = results.find((result) => result.currency)?.currency;
  if (detected && !state.txns.length) setCurrency(detected);
  state.txns = mergeTxns(state.txns, found);
  state.welcome = false;
  state.animateTotal = true;
  if (state.remember === "yes") remember();
  else if (state.remember === null) state.askRemember = true;
  runAnalysis();
}

async function handleFiles(files: File[]): Promise<void> {
  if (!files.length || state.busy) return;
  state.busy = true;
  state.messages = [];
  const results: ReadResult[] = [];
  for (const [i, file] of files.entries()) {
    setStatus(files.length > 1 ? t("reading_many", { done: i + 1, total: files.length }) : t("reading", { name: file.name }));
    const result = await readOne(file);
    if (result) results.push(result);
  }
  setStatus("");
  state.busy = false;
  addResults(results);
  render();
}

async function handleText(text: string): Promise<void> {
  if (!text.trim() || state.busy) return;
  state.messages = [];
  try {
    addResults([await readText(text, dateOrder())]);
    els.paste.value = "";
    els.pasteBox.hidden = true;
    els.pasteToggle.setAttribute("aria-expanded", "false");
  } catch {
    state.messages.push({ kind: "error", text: t("err_paste") });
  }
  render();
}

function loadSample(): void {
  const rows = parseCsv(sampleStatement(getLang()));
  state.txns = rowsToTxns(rows, findMapping(rows)!, getLang() === "tr" ? "dmy" : "mdy");
  state.sample = true;
  state.welcome = false;
  state.messages = [];
  state.animateTotal = true;
  state.currency = getLang() === "tr" ? "TRY" : "USD";
  runAnalysis();
  render();
  els.results.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function runAnalysis(): void {
  state.analysis = state.txns.length ? analyze(state.txns) : undefined;
}

function remember(): void {
  save(KEYS.history, pack(trimHistory(state.txns)));
}

function setCurrency(currency: Currency): void {
  state.currency = currency;
  save(KEYS.currency, currency);
}

function decide(id: string, decision: Decision | undefined): void {
  if (decision) state.decisions[id] = decision;
  else delete state.decisions[id];
  if (!state.sample) save(KEYS.decisions, state.decisions);
}

// ---------- results ----------

interface View {
  main: Subscription[];
  possible: Subscription[];
  stopped: Subscription[];
  hidden: Subscription[];
  monthly: number;
  yearly: number;
}

function view(analysis: Analysis): View {
  const decision = (sub: Subscription) => state.decisions[sub.id];
  const visible = (sub: Subscription) => decision(sub) !== "hide";
  const main = [...analysis.subscriptions, ...analysis.possible.filter((sub) => decision(sub) === "add")]
    .filter(visible)
    .sort((a, b) => b.yearly - a.yearly);
  const monthly = main.reduce((sum, sub) => sum + sub.monthly, 0);
  return {
    main,
    possible: analysis.possible.filter((sub) => !decision(sub)),
    stopped: analysis.stopped.filter(visible),
    hidden: [...analysis.subscriptions, ...analysis.possible, ...analysis.stopped].filter((sub) => !visible(sub)),
    monthly,
    yearly: monthly * 12,
  };
}

function alertHtml(kind: "rise" | "new" | "info" | "warn", text: string): string {
  const name: IconName = kind === "rise" ? "rise" : kind === "new" ? "sparkle" : kind === "warn" ? "alert" : "info";
  return `<li class="alert alert-${kind}">${icon(name)}<span>${text}</span></li>`;
}

function alerts(v: View, analysis: Analysis): string[] {
  const list: string[] = [];
  const b = (text: string) => `<strong>${escapeHtml(text)}</strong>`;
  for (const sub of v.main) {
    const change = sub.changes.at(-1);
    if (change && change.pct > 0) {
      list.push(
        alertHtml(
          "rise",
          t("alert_rise", { name: b(nameOf(sub)), pct: b(percent(change.pct)), from: money(change.from), to: b(money(change.to)), date: shortDate(change.date) }),
        ),
      );
    }
  }
  for (const sub of v.main.filter((sub) => sub.isNew)) {
    list.push(
      alertHtml(
        "new",
        t("alert_new", {
          name: b(nameOf(sub)),
          amount: money(sub.amount),
          cadence: cadenceLabel(sub.cadence),
          date: shortDate(sub.charges[0].date),
          yearly: b(totalMoney(sub.yearly)),
        }),
      ),
    );
  }
  for (const sub of v.main.filter((sub) => sub.twin).slice(0, 1)) list.push(alertHtml("warn", t("alert_twin", { name: b(nameOf(sub)) })));
  const span = Math.round((analysis.end - analysis.start) / DAY) + 1;
  if (span < 45) list.push(alertHtml("info", escapeHtml(t("alert_short", { days: span }))));
  if (!v.main.length) list.push(alertHtml("info", escapeHtml(t("alert_none"))));
  return list;
}

function sparkline(sub: Subscription): string {
  const charges = sub.charges.slice(-12);
  if (charges.length < 2) return "";
  const max = Math.max(...charges.map((charge) => charge.amount));
  const rises = new Set(sub.changes.filter((change) => change.pct > 0).map((change) => change.date));
  const bars = charges
    .map((charge, i) => {
      const h = Math.max(3, Math.round((charge.amount / max) * 22));
      const raised = rises.has(charge.date) || (i > 0 && charge.amount > charges[i - 1].amount * 1.03 && !sub.variable);
      return `<rect x="${i * 7}" y="${24 - h}" width="5" height="${h}" rx="1.5" class="${raised ? "bar-rise" : "bar"}"/>`;
    })
    .join("");
  return `<svg class="spark" viewBox="0 0 ${charges.length * 7 - 2} 24" width="${charges.length * 7 - 2}" height="24" aria-hidden="true">${bars}</svg>`;
}

function subHtml(sub: Subscription, mode: "main" | "possible" | "stopped" | "hidden"): string {
  const decision = state.decisions[sub.id];
  const name = nameOf(sub);
  const change = sub.changes.at(-1);
  const badges: string[] = [];
  if (sub.isNew) badges.push(`<span class="badge badge-new">${t("badge_new")}</span>`);
  if (change && mode !== "stopped") {
    badges.push(
      change.pct > 0
        ? `<span class="badge badge-rise">${t("badge_rise", { pct: percent(change.pct) })}</span>`
        : `<span class="badge">${t("badge_drop", { pct: "−" + percent(change.pct) })}</span>`,
    );
  }
  if (sub.charges.length === 1) badges.push(`<span class="badge" title="${escapeHtml(t("once_hint", { cadence: cadenceLabel(sub.cadence) }))}">${t("badge_once")}</span>`);
  if (sub.variable) badges.push(`<span class="badge" title="${escapeHtml(t("varies_hint"))}">${t("badge_varies")}</span>`);
  if (sub.twin) badges.push(`<span class="badge badge-warn">${t("badge_twin")}</span>`);

  const when = mode === "stopped" ? t("last", { date: shortDate(sub.charges.at(-1)!.date, true) }) : t("next", { date: shortDate(sub.next) });
  const meta = [t(`cat_${sub.category}` as Key), cadenceLabel(sub.cadence), when].join(" · ");

  let actions = "";
  if (mode === "main") {
    actions = `
      <div class="choice" role="group" aria-label="${escapeHtml(name)}">
        <button type="button" data-action="keep" aria-pressed="${decision === "keep"}">${icon("check")}${t("keep")}</button>
        <button type="button" data-action="cancel" aria-pressed="${decision === "cancel"}">${icon("close")}${t("cancel_it")}</button>
      </div>
      ${sub.merchant?.manage ? `<a class="ghost small" href="${sub.merchant.manage}" target="_blank" rel="noopener noreferrer">${icon("external")}${t("manage")}</a>` : ""}
      <button type="button" class="ghost small" data-action="hide">${icon("hide")}${t("hide")}</button>`;
  } else if (mode === "possible") {
    actions = `<button type="button" class="secondary small" data-action="add">${icon("plus")}${t("add_it")}</button>
      <button type="button" class="ghost small" data-action="hide">${icon("hide")}${t("hide")}</button>`;
  } else if (mode === "hidden") {
    actions = `<button type="button" class="ghost small" data-action="restore">${icon("reset")}${t("restore")}</button>`;
  }

  const charges = [...sub.charges]
    .reverse()
    .map((charge) => `<li><span>${shortDate(charge.date, true)}</span><span class="charge-text">${escapeHtml(charge.text)}</span><span>${money(charge.amount)}</span></li>`)
    .join("");

  return `
    <li class="sub${decision === "cancel" ? " is-cancel" : ""}${mode !== "main" ? " is-minor" : ""}" data-id="${escapeHtml(sub.id)}" style="--hue:${hueOf(name)}">
      <div class="sub-main">
        <span class="avatar" aria-hidden="true">${escapeHtml(name.slice(0, 1).toLocaleUpperCase(locale()))}</span>
        <div class="sub-info">
          <strong class="sub-name">${escapeHtml(name)}</strong>
          <span class="sub-meta">${escapeHtml(meta)}</span>
          ${badges.length ? `<span class="badges-row">${badges.join("")}</span>` : ""}
        </div>
        <div class="sub-cost">
          <strong>${money(sub.amount)}<small>${perLabel(sub.cadence)}</small></strong>
          <span>${t("per_year_short", { amount: totalMoney(sub.yearly) })}</span>
          ${sparkline(sub)}
        </div>
      </div>
      <div class="sub-actions">${actions}</div>
      <details class="charges"><summary>${plural(sub.charges.length, "charges_one", "charges_other")}</summary><ul>${charges}</ul></details>
    </li>`;
}

function render(): void {
  els.status.innerHTML += state.messages
    .map((message) => `<p class="${message.kind}">${icon(message.kind === "error" ? "alert" : "info")}<span>${escapeHtml(message.text)}</span></p>`)
    .join("");
  state.messages = [];

  const analysis = state.analysis;
  els.results.hidden = !analysis;
  els.hero.classList.toggle("compact", Boolean(analysis));
  els.start.hidden = Boolean(analysis);
  if (!analysis) {
    els.results.innerHTML = "";
    return;
  }
  const v = view(analysis);
  const rises = v.main.filter((sub) => (sub.changes.at(-1)?.pct ?? 0) > 0).length;
  const cancelling = v.main.filter((sub) => state.decisions[sub.id] === "cancel");
  const saving = cancelling.reduce((sum, sub) => sum + sub.monthly, 0);
  const currencyOptions = CURRENCIES.map((c) => `<option value="${c}"${c === state.currency ? " selected" : ""}>${c}</option>`).join("");

  let intro = "";
  if (state.sample) intro = `<p class="intro">${icon("sparkle")}<span>${escapeHtml(t("sample_note"))}</span></p>`;
  else if (state.welcome) intro = `<p class="intro">${icon("calendar")}<span>${escapeHtml(t("welcome_back", { date: shortDate(analysis.end, true) }))}</span></p>`;

  const section = (title: string, hint: string, list: Subscription[], mode: "possible" | "stopped" | "hidden") =>
    list.length
      ? `<details class="extra"><summary>${escapeHtml(title)}</summary>${hint ? `<p class="hint">${escapeHtml(hint)}</p>` : ""}<ul class="subs">${list
          .map((sub) => subHtml(sub, mode))
          .join("")}</ul></details>`
      : "";

  let memory = "";
  if (!state.sample) {
    if (state.askRemember && state.remember === null) {
      memory = `<div class="remember">${icon("lock")}<p>${escapeHtml(t("remember_ask"))}</p>
        <div><button type="button" class="primary small" data-action="remember-yes">${t("remember_yes")}</button>
        <button type="button" class="ghost small" data-action="remember-no">${t("remember_no")}</button></div></div>`;
    } else if (state.remember === "yes") {
      memory = `<div class="remember is-on">${icon("lock")}<p>${escapeHtml(t("remembered"))}</p>
        <button type="button" class="ghost small" data-action="forget">${icon("trash")}${t("forget")}</button></div>`;
    }
  }

  // Cards slide in only for a new analysis, not every time a button redraws the list.
  els.results.classList.toggle("animate", state.animateTotal);
  els.results.innerHTML = `
    ${intro}
    <div class="totals">
      <div class="total-main">
        <span class="label">${t("you_pay")}</span>
        <strong class="big" id="yearly" data-value="${v.yearly}">${totalMoney(v.yearly)}</strong>
        <span class="label">${t("per_year")}</span>
      </div>
      <div class="stat"><strong>${totalMoney(v.monthly)}</strong><span>${t("per_month_total")}</span></div>
      <div class="stat"><strong>${v.main.length}</strong><span>${plural(v.main.length, "subs_one", "subs_other").replace(/^\d+\s*/, "")}</span></div>
      <div class="stat${rises ? " stat-rise" : ""}"><strong>${rises}</strong><span>${plural(rises, "rises_one", "rises_other").replace(/^\d+\s*/, "")}</span></div>
    </div>
    <div class="coverage">
      <span>${escapeHtml(t("coverage", { count: analysis.count, start: shortDate(analysis.start, true), end: shortDate(analysis.end, true) }))}</span>
      <label class="currency">${t("currency")} <select id="currency">${currencyOptions}</select></label>
    </div>
    <ul class="alerts">${alerts(v, analysis).join("")}</ul>
    ${
      cancelling.length
        ? `<p class="savings">${icon("sparkle")}<span>${
            cancelling.length === 1
              ? t("savings_one", { yearly: `<strong>${totalMoney(saving * 12)}</strong>`, monthly: totalMoney(saving) })
              : t("savings", { n: cancelling.length, yearly: `<strong>${totalMoney(saving * 12)}</strong>`, monthly: totalMoney(saving) })
          }</span></p>`
        : ""
    }
    <ul class="subs">${v.main.map((sub) => subHtml(sub, "main")).join("")}</ul>
    ${section(t("possible_title", { n: v.possible.length }), t("possible_hint"), v.possible, "possible")}
    ${section(t("stopped_title", { n: v.stopped.length }), t("stopped_hint"), v.stopped, "stopped")}
    ${section(t("hidden_title", { n: v.hidden.length }), "", v.hidden, "hidden")}
    <div class="result-actions">
      ${v.main.length ? `<button type="button" class="primary" data-action="calendar">${icon("calendar")}${t("ics")}</button>` : ""}
      ${v.main.length ? `<button type="button" class="secondary" data-action="copy">${icon("copy")}${t("copy")}</button>` : ""}
      ${v.main.length && "share" in navigator ? `<button type="button" class="secondary" data-action="share">${icon("share")}${t("share")}</button>` : ""}
      <label class="secondary button">${icon("plus")}${t("add_more")}<input type="file" multiple data-action="add-file" accept="${els.input.accept}" /></label>
      <button type="button" class="ghost" data-action="reset">${icon("reset")}${t("reset")}</button>
    </div>
    ${memory}`;
  animateTotal();
}

function animateTotal(): void {
  const el = document.getElementById("yearly");
  const wanted = state.animateTotal;
  state.animateTotal = false;
  if (!el || !wanted || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = Number(el.dataset.value);
  const started = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / 700);
    el.textContent = totalMoney(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- result actions ----------

function summaryText(v: View): string {
  const lines = [t("summary_head", { n: v.main.length, monthly: totalMoney(v.monthly), yearly: totalMoney(v.yearly) })];
  for (const sub of v.main) {
    const change = sub.changes.at(-1);
    const rise = change && change.pct > 0 ? ` (+${percent(change.pct)})` : "";
    lines.push(`• ${nameOf(sub)}: ${money(sub.amount)}${perLabel(sub.cadence)}${rise}`);
  }
  lines.push("", t("summary_foot", { url: SITE_URL }));
  return lines.join("\n");
}

function downloadCalendar(v: View): void {
  const events: CalendarEvent[] = v.main.map((sub) => {
    const name = nameOf(sub);
    const amount = money(sub.amount);
    return state.decisions[sub.id] === "cancel"
      ? { uid: `cancel-${sub.id}`, date: sub.next - 2 * DAY, summary: t("ics_cancel", { name, amount }), description: t("ics_desc"), alarmDays: 1 }
      : { uid: sub.id, date: sub.next, summary: t("ics_renews", { name, amount }), description: t("ics_desc"), cadence: sub.cadence, alarmDays: 2 };
  });
  const url = URL.createObjectURL(new Blob([buildCalendar(events)], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "subtotal-reminders.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  state.messages.push({ kind: "info", text: t("ics_done") });
  els.status.innerHTML = "";
  render();
}

async function copySummary(v: View, button: HTMLElement): Promise<void> {
  const text = summaryText(v);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.innerHTML = `${icon("check")}${t("copied")}`;
}

function forget(): void {
  for (const key of [KEYS.history, KEYS.remember, KEYS.decisions]) save(key, undefined);
  state.remember = null;
  state.decisions = {};
  state.txns = [];
  state.analysis = undefined;
  state.askRemember = false;
  els.status.innerHTML = "";
  state.messages.push({ kind: "info", text: t("forgotten") });
  render();
}

els.results.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target || target instanceof HTMLInputElement || !state.analysis) return;
  const action = target.dataset.action;
  const id = target.closest<HTMLElement>("[data-id]")?.dataset.id;
  const v = view(state.analysis);
  switch (action) {
    case "keep":
    case "cancel":
      if (id) decide(id, state.decisions[id] === action ? undefined : action);
      break;
    case "hide":
    case "add":
      if (id) decide(id, action);
      break;
    case "restore":
      if (id) decide(id, undefined);
      break;
    case "calendar":
      downloadCalendar(v);
      return;
    case "copy":
      void copySummary(v, target);
      return;
    case "share":
      void navigator.share({ title: "Subtotal", text: summaryText(v) }).catch(() => undefined);
      return;
    case "reset":
      state.txns = [];
      state.analysis = undefined;
      state.sample = false;
      state.welcome = false;
      els.status.innerHTML = "";
      render();
      window.scrollTo({ top: 0 });
      return;
    case "remember-yes":
      state.remember = "yes";
      save(KEYS.remember, "yes");
      save(KEYS.decisions, state.decisions);
      remember();
      break;
    case "remember-no":
      state.remember = "no";
      save(KEYS.remember, "no");
      break;
    case "forget":
      forget();
      return;
  }
  const open = [...els.results.querySelectorAll<HTMLDetailsElement>("details.extra")].map((details) => details.open);
  render();
  els.results.querySelectorAll<HTMLDetailsElement>("details.extra").forEach((details, i) => (details.open = open[i] ?? false));
  // Keep keyboard focus on the button that was pressed after the list is redrawn.
  if (id && action) els.results.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"] [data-action="${action}"]`)?.focus();
});

els.results.addEventListener("change", (event) => {
  const target = event.target as HTMLElement;
  if (target instanceof HTMLSelectElement && target.id === "currency") {
    setCurrency(target.value as Currency);
    render();
  } else if (target instanceof HTMLInputElement && target.dataset.action === "add-file") {
    void handleFiles([...(target.files ?? [])]);
  }
});

// ---------- static page ----------

function renderStatic(): void {
  document.documentElement.lang = getLang();
  document.title = t("app_title");
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const text = t(el.dataset.i18n as Key);
    el.innerHTML = el.dataset.icon ? icon(el.dataset.icon as IconName) + `<span>${escapeHtml(text)}</span>` : escapeHtml(text);
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-icon]:not([data-i18n])")) el.innerHTML = icon(el.dataset.icon as IconName);
  els.paste.placeholder = t("paste_placeholder");
  els.lang.textContent = t("lang_name");
  els.install.textContent = t("install");
  for (const id of ["repo", "repo-footer"]) $<HTMLAnchorElement>(id).href = REPO_URL;
}

els.input.addEventListener("change", () => {
  void handleFiles([...(els.input.files ?? [])]);
  els.input.value = "";
});

for (const type of ["dragenter", "dragover"]) {
  document.addEventListener(type, (event) => {
    event.preventDefault();
    els.drop.classList.add("dragging");
  });
}
document.addEventListener("dragleave", (event) => {
  if (!(event as DragEvent).relatedTarget) els.drop.classList.remove("dragging");
});
document.addEventListener("drop", (event) => {
  event.preventDefault();
  els.drop.classList.remove("dragging");
  void handleFiles([...((event as DragEvent).dataTransfer?.files ?? [])]);
});

document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.files ?? [])];
  if (files.length) {
    event.preventDefault();
    void handleFiles(files);
    return;
  }
  const text = event.clipboardData?.getData("text") ?? "";
  if ((event.target as HTMLElement).closest("textarea, input")) return;
  if (text.trim()) {
    event.preventDefault();
    void handleText(text);
  }
});

els.sample.addEventListener("click", loadSample);
els.pasteToggle.addEventListener("click", () => {
  els.pasteBox.hidden = !els.pasteBox.hidden;
  els.pasteToggle.setAttribute("aria-expanded", String(!els.pasteBox.hidden));
  if (!els.pasteBox.hidden) els.paste.focus();
});
els.pasteGo.addEventListener("click", () => void handleText(els.paste.value));

els.lang.addEventListener("click", () => {
  setLang(getLang() === "tr" ? "en" : "tr");
  els.status.innerHTML = "";
  renderStatic();
  render();
});

let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event as Event & { prompt: () => Promise<void> };
  els.install.hidden = false;
});
els.install.addEventListener("click", () => {
  void installPrompt?.prompt();
  els.install.hidden = true;
});

renderStatic();
// Coming back next month: what was remembered is analysed right away, before any new file is dropped.
if (state.remember === "yes") {
  const history = unpack(load<unknown>(KEYS.history, []));
  if (history.length) {
    state.txns = history;
    state.welcome = true;
    runAnalysis();
  }
}
render();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("./sw.js"));
}
