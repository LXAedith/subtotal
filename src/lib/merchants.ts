import { fold } from "./text";

export type Category =
  | "video"
  | "music"
  | "apps"
  | "cloud"
  | "ai"
  | "software"
  | "learning"
  | "dating"
  | "gaming"
  | "reading"
  | "security"
  | "fitness"
  | "bills"
  | "creators"
  | "other";

export interface Merchant {
  id: string;
  name: string;
  category: Category;
  /** Tested against the folded (lower-case ASCII) description. */
  pattern: RegExp;
  /**
   * A single charge is enough to call it a subscription. False for stores that also sell one-off things
   * (App Store, Google Play, PlayStation) and for bills whose amount changes every month.
   */
  strong: boolean;
  /** Where the subscription is managed or cancelled. */
  manage?: string;
  /** A kind of business rather than one company: grouped and named by the statement text instead. */
  generic?: boolean;
}

const GENERIC = new Set(["vpn", "passwords", "gym", "telecom", "utilities"]);

const m = (id: string, name: string, category: Category, pattern: RegExp, strong = true, manage?: string): Merchant => ({
  id,
  name,
  category,
  pattern,
  strong,
  manage,
  generic: GENERIC.has(id),
});

// Order matters: the first match wins, so specific Google and Apple services come before the stores.
export const MERCHANTS: Merchant[] = [
  m("netflix", "Netflix", "video", /netflix/, true, "https://www.netflix.com/cancelplan"),
  m("youtube", "YouTube Premium", "video", /youtube|yt premium/, true, "https://www.youtube.com/paid_memberships"),
  m("disney", "Disney+", "video", /disney\s*(plus|\+)|disneyplus/, true, "https://www.disneyplus.com/account"),
  m("prime", "Amazon Prime", "video", /amazon\s*prime|amzn\s*prime|prime\s*video|primevideo|prime membership/),
  m("max", "HBO Max", "video", /hbo\s*max|\bhbomax|max\.com|blutv/),
  m("exxen", "Exxen", "video", /exxen/),
  m("gain", "Gain", "video", /\bgain medya|\bgain\.tv|^gain\b/),
  m("tod", "TOD", "video", /\btod\b|bein\s*connect|tod tv/),
  m("digiturk", "Digiturk", "video", /digiturk/),
  m("tabii", "tabii", "video", /\btabii\b/),
  m("tvplus", "TV+", "video", /\btv\s*\+|tvplus/),
  m("mubi", "MUBI", "video", /\bmubi\b/),
  m("appletv", "Apple TV+", "video", /apple\s*tv/),
  m("paramount", "Paramount+", "video", /paramount/),
  m("hulu", "Hulu", "video", /\bhulu\b/),
  m("peacock", "Peacock", "video", /peacock/),
  m("crunchyroll", "Crunchyroll", "video", /crunchyroll/),
  m("spotify", "Spotify", "music", /spotify/, true, "https://www.spotify.com/account/subscription/"),
  m("applemusic", "Apple Music", "music", /apple\s*music/),
  m("deezer", "Deezer", "music", /deezer/),
  m("tidal", "TIDAL", "music", /\btidal\b/),
  m("fizy", "fizy", "music", /\bfizy\b/),
  m("audible", "Audible", "reading", /audible/),
  m("storytel", "Storytel", "reading", /storytel/),
  m("kindle", "Kindle Unlimited", "reading", /kindle unlimited|kindle unltd/),
  m("scribd", "Scribd", "reading", /scribd|everand/),
  m("medium", "Medium", "reading", /medium\.com|\bmedium corp/),
  m("substack", "Substack", "reading", /substack/),
  m("nytimes", "The New York Times", "reading", /nytimes|ny times|new york times/),
  m("googleone", "Google One", "cloud", /google\s*\*?\s*(one|storage)\b|googleone/, true, "https://play.google.com/store/account/subscriptions"),
  m("icloud", "iCloud+", "cloud", /icloud/, true, "https://apps.apple.com/account/subscriptions"),
  m("dropbox", "Dropbox", "cloud", /dropbox/, true, "https://www.dropbox.com/account/plan"),
  m("lifebox", "lifebox", "cloud", /lifebox/),
  m("chatgpt", "ChatGPT", "ai", /openai|chatgpt/),
  m("claude", "Claude", "ai", /anthropic|claude\.ai/),
  m("gemini", "Google AI / Gemini", "ai", /google\s*\*?\s*gemini|gemini advanced|google\s*\*?\s*ai\b/),
  m("midjourney", "Midjourney", "ai", /midjourney/),
  m("perplexity", "Perplexity", "ai", /perplexity/),
  m("cursor", "Cursor", "ai", /cursor/),
  m("github", "GitHub", "software", /github/),
  m("adobe", "Adobe", "software", /adobe/, true, "https://account.adobe.com/plans"),
  m("canva", "Canva", "software", /\bcanva\b/),
  m("notion", "Notion", "software", /notion/),
  m("microsoft", "Microsoft / Xbox", "software", /microsoft|msft|xbox/, false, "https://account.microsoft.com/services"),
  m("linkedin", "LinkedIn Premium", "software", /linkedin/, true, "https://www.linkedin.com/premium/manage/"),
  m("zoom", "Zoom", "software", /\bzoom\b|zoom\.us/),
  m("duolingo", "Duolingo", "learning", /duolingo/),
  m("babbel", "Babbel", "learning", /babbel/),
  m("cambly", "Cambly", "learning", /cambly/),
  m("udemy", "Udemy", "learning", /udemy/, false),
  m("coursera", "Coursera", "learning", /coursera/),
  m("tinder", "Tinder", "dating", /tinder/),
  m("bumble", "Bumble", "dating", /bumble/),
  m("hinge", "Hinge", "dating", /\bhinge\b/),
  m("badoo", "Badoo", "dating", /badoo/),
  m("patreon", "Patreon", "creators", /patreon/),
  m("twitch", "Twitch", "creators", /twitch/),
  m("discord", "Discord Nitro", "creators", /discord/),
  m("playstation", "PlayStation", "gaming", /playstation|sony\s*interactive|\bpsn\b/, false),
  m("nintendo", "Nintendo", "gaming", /nintendo/, false),
  m("eaplay", "EA Play", "gaming", /ea\s*play|electronic arts/, false),
  m("vpn", "VPN", "security", /nordvpn|nord\s*sec|expressvpn|surfshark|proton\s*(ag|vpn|mail)|mullvad/),
  m("passwords", "Password manager", "security", /1password|bitwarden|lastpass|dashlane|keeper security/),
  m("headspace", "Headspace", "fitness", /headspace/),
  m("calm", "Calm", "fitness", /\bcalm\.com|\bcalm app/),
  m("strava", "Strava", "fitness", /strava/),
  m("gym", "Gym", "fitness", /macfit|mars\s*athletic|fitness|\bgym\b|spor\s*salonu|spor merkezi/, false),
  m("apple", "Apple (App Store)", "apps", /apple\.com|apple services|itunes|\bapple\b/, false, "https://apps.apple.com/account/subscriptions"),
  m("googleplay", "Google Play", "apps", /google\s*\*|google\s*play|g\.co\/helppay/, false, "https://play.google.com/store/account/subscriptions"),
  m("telecom", "Phone & internet", "bills", /turkcell|vodafone|turk\s*telekom|turktelekom|superonline|turknet|millenicom|ttnet|kablonet|verizon|at&t|t-mobile|comcast|xfinity/, false),
  m("utilities", "Utilities", "bills", /enerjisa|ck enerji|igdas|iski|aski|izsu|baskentgaz|elektrik|dogalgaz|su idaresi/, false),
];

export function findMerchant(text: string): Merchant | undefined {
  const folded = fold(text);
  return MERCHANTS.find((merchant) => merchant.pattern.test(folded));
}

// Transfers, cash and bank charges recur too, but nobody wants them listed as subscriptions.
const EXCLUDED =
  /tesekkur|thank you|kredi karti odeme|kart odemesi|card payment|autopay|havale|\beft\b|\bfast\b|transfer|virman|maas|salary|payroll|\batm\b|nakit|cash|faiz|interest|bsmv|kkdf|komisyon|iade|refund|reversal|kira|\brent\b/;

export function isExcluded(text: string): boolean {
  return EXCLUDED.test(fold(text));
}

const NOISE = new Set(
  (
    "tr tur turkey turkiye istanbul ankara izmir bursa antalya kocaeli adana konya mersin gaziantep kayseri eskisehir " +
    "us usa gb uk ie nl lu de fr se sg ca com www net org http https pos sanal internet online harcama alisveris islem " +
    "kart card purchase payment odeme debit visa mastercard troy try tl usd eur gbp ltd sti as inc llc bv gmbh the ve and " +
    "hizm hizmetleri tic san pazarlama ticaret limited sirketi"
  ).split(" "),
);

function isNoise(word: string): boolean {
  const digits = (word.match(/\d/g) ?? []).length;
  return NOISE.has(word) || /^\d+$/.test(word) || digits >= 4 || (digits >= 2 && word.length >= 5) || word.length < 2;
}

/** Groups "SPOTIFY P1B2C3 STOCKHOLM" and "SPOTIFY X9Y8Z7 STOCKHOLM" under one key by dropping reference codes. */
export function merchantKey(text: string): string {
  const words = fold(text)
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !isNoise(word));
  return words.slice(0, 2).join(" ") || fold(text).replace(/\s+/g, " ").trim().slice(0, 16);
}

/** "IYZICO/FORMA SPOR SALONU ISTANBUL TR 1234" → "FORMA SPOR SALONU": the original words, minus the noise. */
export function displayName(text: string): string {
  const words = text
    .replace(/[*/\\_|#]+/g, " ")
    .split(/\s+/)
    .filter((word) => {
      const folded = fold(word).replace(/[^a-z0-9]/g, "");
      return folded && !isNoise(folded) && !/^(iyzico|iyz|paytr|param|ipara|paypal|pp|sq|sp|tst)$/.test(folded);
    });
  return words.slice(0, 3).join(" ") || text.trim().slice(0, 24);
}
