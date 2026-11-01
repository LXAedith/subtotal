# Why Subtotal exists

*November 2026. Türkçe: [ARASTIRMA.md](ARASTIRMA.md)*

## The problem

People pay for more subscriptions than they think, and the amounts creep up without anyone noticing.

| Finding | Source |
| --- | --- |
| On average, people underestimate their monthly subscription spending by **$133**. 42 % said they had stopped using a service but were still paying for it. | C+R Research survey of 1,000 US adults ([NBC](https://www.nbcwashington.com/news/business/money-report/consumers-spend-an-average-133-more-each-month-on-subscriptions-than-they-realize-study-shows/3067565/)) |
| A 2025 CNET/YouGov survey of 2,440 US adults found Gen Z alone wastes about **$23 a month** on forgotten or unused subscriptions. | [CordCutters News](https://cordcuttersnews.com/americans-spend-over-200-a-year-on-unused-subscriptions-here-is-how-to-easily-stop-them/) |
| In Turkey, Netflix raised prices twice in 2026: about **+26 % in June** and again in October (Basic 189.99 → 259.99 TL). Most people only notice on the statement, if at all. | [Paratic](https://paratic.com/netflix-sessizce-zam-yapti-fiyatlar-yuzde-26-artti/), [Gazete Oksijen](https://gazeteoksijen.com/ekonomi/netflix-turkiye-abonelik-ucretlerine-zam-yapti-iste-yeni-fiyatlar-291569) |
| Real complaints: a user found **399 TL charged every month** only by reading their statements; others report unnoticed charges of 999 TL and 252 TL after a trial or a cancellation. | Şikayetvar: [1](https://www.sikayetvar.com/yapi-kredi-bankasi/cv-marker-aboneliginin-izinsiz-cekimi-ve-iptal-edilememesi), [2](https://www.sikayetvar.com/mindguru/izinsiz-cekilen-999-tl-icin-geri-odeme-ve-abonelik-iptali-talebi), [3](https://www.sikayetvar.com/betterme/iptal-edilen-abonelik-sonrasi-izinsiz-252-tl-cekimi-ve-kart-bilgisi-silinmesi-talebi) |
| The best-known subscription finder needs your bank login through Plaid. One review collection lists about **150 reviews** of a bank-linking loop. | [Unstar](https://unstar.app/blog/rocket-money-wont-link-bank-account-loop-reviews-2026) |

The answer is already in everyone's bank statement. It is just buried among hundreds of grocery and fuel payments, and spread over several cards and months.

## What exists today

| Tool | How it works | Gap |
| --- | --- | --- |
| Rocket Money, Monarch, Copilot, Emma | Connect to your bank with Plaid or open banking | Bank login required; paid tiers; US/UK/EU only. They do not work with Turkish banks at all. |
| SubFind, Unsubbed, StatementDecoder, Monavio | Upload a statement to their server | Your full statement goes to someone else's server. |
| SubTracker, Bobby, RecurDash and other manual trackers | You type in your subscriptions | Cannot find what you forgot, which is the whole point. |
| [LowerMySubs](https://www.lowermysubs.com/scan), [Triimly](https://triimly.floot.app/) | Statement scan in the browser | Closed source; US-style CSV formats; no PDF statements; no memory between months. |
| [refund-radar](https://github.com/andreolf/refund-radar), [SubZero](https://github.com/Sumama-Jameel/subzero) | Open-source scripts | Need Python or a server; not for everyday users. |
| Bank apps | Show every transaction | Don't group charges, spot price rises or add up a yearly total; one bank at a time. |

The gap Subtotal fills:

- **No bank login and no upload.** The statement is read in the browser, and the page's Content Security Policy blocks it from sending data anywhere.
- **Any bank's export.** Excel (.xlsx and the old .xls), CSV in any encoding and delimiter, PDF statements, the HTML-as-Excel files some internet banks produce, and text pasted from online banking. Turkish formats (`1.234,56`, `05.10.2026`, Windows-1254, "İşlem Tarihi / Açıklama / Tutar") are first-class.
- **Price rises and new trials**, not only a list.
- **A reason to come back:** with the user's consent it remembers past months on the device, so next month only the new statement is needed.

## An honest note on the decision

Subtotal was built by a routine that scores ideas before building anything (frequency, severity, evidence, gap, feasibility, habit, shareability; the gate is 26/35). This idea scored **25/35**: the evidence and the gap are strong, but people look at a statement monthly, not weekly. The owner of the routine decided to build it anyway. Monthly use is a reasonable rhythm for a money tool, and the Turkish bank gap had no good answer.

## Design decisions

- **Ten seconds to value:** a sample statement shows the whole result before anyone exports anything.
- **Three steps:** drop the statement → see subscriptions → mark keep/cancel and add renewal reminders to your own calendar (an `.ics` file, so reminders come from the user's calendar, not from us).
- **No dark patterns:** no account, no ads, no analytics, no notifications. Memory is opt-in and can be wiped with one button.
