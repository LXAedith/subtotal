const en = {
  app_title: "Subtotal — find every subscription in your bank statement",
  eyebrow: "Subscription finder · private by design",
  hero_title: "Find every subscription hiding in your statement",
  hero_tagline:
    "Drop your bank or credit card statement. See every subscription, every price rise and what they cost you a year, in seconds. Your statement never leaves this device.",
  badge_private: "Statement stays on your device",
  badge_banks: "Works with any bank",
  badge_free: "Free & open source · no sign-up",

  drop_title: "Drop your statement here",
  drop_hint: "or click to choose · Excel, CSV or PDF · several months at once is best",
  sample: "Try a sample statement",
  paste_toggle: "Paste from online banking",
  paste_label: "Copy the transaction list from your bank's website and paste it here",
  paste_placeholder: "05.10.2026  NETFLIX.COM  259,99\n09.10.2026  SPOTIFY  99,99\n…",
  paste_go: "Find subscriptions",
  howto_title: "How do I get my statement?",
  howto_1: "Log in to your bank's website or app and open the account or card you pay subscriptions with.",
  howto_2: "Find the transaction list (\"transactions\", \"statement\" or \"account activity\") and pick the last 3 to 12 months.",
  howto_3: "Download it as Excel or CSV, or use the PDF statement your bank emails you. Drop all the files here together.",
  howto_tip: "More months find more: a monthly charge needs to appear at least twice, a yearly one needs a year.",

  reading: "Reading {name}…",
  reading_many: "Reading {done} of {total} files…",
  err_empty: "No transactions found in {name}. Is it the transaction list?",
  err_columns: "Couldn't tell which columns hold the date, description and amount in {name}.",
  err_scanned: "{name} looks like a scanned image. Download the statement as Excel or CSV instead.",
  err_password: "{name} is password-protected.",
  err_password_wrong: "That password didn't open {name}.",
  err_broken: "{name} couldn't be opened. It may be damaged.",
  err_unsupported: "{name} isn't a format Subtotal can read. Use Excel, CSV or PDF.",
  err_paste: "No transactions found in the pasted text. Each line needs a date, a description and an amount.",
  password_title: "This PDF is locked",
  password_text:
    "Banks often protect emailed statements with a password, such as part of your ID or phone number. It is only used here, in your browser, to open the file.",
  password_label: "PDF password",
  password_open: "Open",
  cancel: "Cancel",
  columns_title: "Which columns are which?",
  columns_text: "Pick the columns from the first rows of {name}.",
  col_date: "Date",
  col_text: "Description",
  col_amount: "Amount",
  col_use: "Use these columns",
  col_none: "Column {n}",

  welcome_back: "Welcome back. Your remembered statements run to {date}. Add this month's statement to catch new charges and price rises.",
  sample_note: "This is a made-up sample. Drop your own statement to see yours.",
  you_pay: "You pay",
  per_year: "a year",
  per_month_total: "a month",
  subs_one: "subscription",
  subs_other: "subscriptions",
  rises_one: "price rise",
  rises_other: "price rises",
  coverage: "{count} payments · {start} – {end}",
  currency: "Currency",

  alert_rise: "{name} went up {pct}: {from} → {to} on {date}.",
  alert_new: "New: {name}, {amount} {cadence} since {date}. That is {yearly} a year.",
  alert_twin: "{name} is charged more than once per period. Two accounts or a double charge?",
  alert_short:
    "This covers only {days} days, so only services Subtotal knows by name can be found. Add 2–3 more months to catch the rest.",
  alert_none: "No subscriptions found in these payments. Try adding more months, or the card you pay subscriptions with.",

  cad_weekly: "weekly",
  cad_biweekly: "every 2 weeks",
  cad_monthly: "monthly",
  cad_quarterly: "every 3 months",
  cad_semiannual: "every 6 months",
  cad_yearly: "yearly",
  per_weekly: "/wk",
  per_biweekly: "/2 wk",
  per_monthly: "/mo",
  per_quarterly: "/3 mo",
  per_semiannual: "/6 mo",
  per_yearly: "/yr",
  per_year_short: "{amount}/yr",
  next: "next {date}",
  last: "last {date}",
  badge_new: "New",
  badge_rise: "+{pct}",
  badge_drop: "{pct}",
  badge_once: "Seen once",
  badge_varies: "Amount varies",
  badge_twin: "Charged twice",
  once_hint: "Seen once in these statements. Assumed {cadence} until more months are added.",
  varies_hint: "The amount changes a little each time, which usually means it is billed in a foreign currency.",

  keep: "Keep",
  cancel_it: "Cancel",
  manage: "Manage",
  hide: "Not a subscription",
  restore: "Show again",
  add_it: "It's a subscription",
  charges_one: "1 payment",
  charges_other: "{n} payments",
  savings: "Cancelling {n} saves {yearly} a year ({monthly} a month).",
  savings_one: "Cancelling 1 saves {yearly} a year ({monthly} a month).",

  possible_title: "Worth a look ({n})",
  possible_hint: "These repeat, but not often enough yet to be sure.",
  stopped_title: "No longer charged ({n})",
  stopped_hint: "Charged regularly before, but not lately. Good if you cancelled them.",
  hidden_title: "Hidden ({n})",

  ics: "Add renewal reminders to my calendar",
  ics_done: "Calendar file saved. Open it to add the reminders.",
  ics_renews: "{name} renews · {amount}",
  ics_cancel: "Cancel {name} before it renews ({amount})",
  ics_desc: "Found by Subtotal in your statement. Reminder 2 days before.",
  copy: "Copy summary",
  copied: "Copied",
  share: "Share",
  add_more: "Add another statement",
  reset: "Start over",
  summary_head: "Subtotal: {n} subscriptions, {monthly} a month ({yearly} a year)",
  summary_foot: "Found privately in my browser with {url}",

  remember_ask: "Remember these payments on this device? Next month, just drop the new statement and Subtotal will show what changed.",
  remember_yes: "Remember",
  remember_no: "Not now",
  remembered: "Remembered on this device only.",
  forget: "Forget everything",
  forgotten: "Everything Subtotal remembered has been deleted from this device.",

  how_title: "How it works",
  how_1_t: "1. Drop your statement",
  how_1:
    "Excel, CSV or PDF from any bank or card, in any language. Subtotal finds the date, description and amount columns itself, and reads several months at once.",
  how_2_t: "2. It finds what repeats",
  how_2:
    "Payments to the same company on a weekly, monthly or yearly rhythm, with a steady amount, are subscriptions. 60+ services like Netflix, Spotify or iCloud are recognised from a single charge.",
  how_3_t: "3. Decide and set reminders",
  how_3:
    "See the yearly total, price rises and new trials that turned paid. Mark what to cancel and add renewal reminders to your own calendar.",
  privacy_title: "Your statement never leaves this device",
  privacy_1: "No server: the file is read by JavaScript in this browser tab.",
  privacy_2: "A strict Content Security Policy stops this page from sending data anywhere. You can check it in your browser's developer tools.",
  privacy_3: "No bank login, no account, no tracking, no ads. Works offline after the first visit.",
  faq_title: "Questions",
  faq_1_q: "Why not just look at my bank app?",
  faq_1_a:
    "Bank apps list every payment, but they don't group them, spot that Netflix went up 37 % or add up what all your subscriptions cost in a year. Subtotal does, across several cards and banks at once.",
  faq_2_q: "Is it safe to open my statement here?",
  faq_2_a:
    "Yes. Nothing is uploaded: the page has no server to upload to, and the browser blocks it from sending data. The code is open source on GitHub.",
  faq_3_q: "It missed a subscription. Why?",
  faq_3_a:
    "A monthly charge has to appear at least twice, and a yearly one needs statements a year apart. Add more months. Charges billed through the App Store or Google Play show up as Apple or Google.",

  footer_privacy:
    "Everything happens in your browser. A strict Content Security Policy blocks this page from sending your statement anywhere: check it in your browser's developer tools, or turn off Wi-Fi and keep going.",
  footer_source: "Source code on GitHub",
  footer_license: "MIT licensed",
  install: "Install app",
  lang_name: "Türkçe",

  cat_video: "Video",
  cat_music: "Music",
  cat_apps: "App store",
  cat_cloud: "Cloud storage",
  cat_ai: "AI",
  cat_software: "Software",
  cat_learning: "Learning",
  cat_dating: "Dating",
  cat_gaming: "Gaming",
  cat_reading: "Reading",
  cat_security: "Security",
  cat_fitness: "Health & fitness",
  cat_bills: "Bills",
  cat_creators: "Creators",
  cat_other: "Other",
};

export type Key = keyof typeof en;

const tr: Record<Key, string> = {
  app_title: "Subtotal — ekstrendeki tüm abonelikleri bul",
  eyebrow: "Abonelik bulucu · gizlilik öncelikli",
  hero_title: "Ekstrende gizlenen tüm abonelikleri bul",
  hero_tagline:
    "Banka ya da kredi kartı ekstreni bırak. Tüm abonelikleri, her zammı ve yıllık maliyetlerini saniyeler içinde gör. Ekstren bu cihazdan hiç çıkmaz.",
  badge_private: "Ekstre cihazında kalır",
  badge_banks: "Her bankayla çalışır",
  badge_free: "Ücretsiz ve açık kaynak · üyelik yok",

  drop_title: "Ekstreni buraya bırak",
  drop_hint: "ya da tıklayıp seç · Excel, CSV veya PDF · birkaç ay birden en iyisi",
  sample: "Örnek ekstreyle dene",
  paste_toggle: "İnternet şubesinden yapıştır",
  paste_label: "Bankanın sitesindeki hesap hareketlerini kopyalayıp buraya yapıştır",
  paste_placeholder: "05.10.2026  NETFLIX.COM  259,99\n09.10.2026  SPOTIFY  99,99\n…",
  paste_go: "Abonelikleri bul",
  howto_title: "Ekstremi nereden alırım?",
  howto_1: "Bankanın internet şubesine ya da mobil uygulamasına gir; aboneliklerini ödediğin hesabı ya da kartı aç.",
  howto_2: "\"Hesap hareketleri\", \"kart hareketleri\" ya da \"ekstre\" bölümünü bul ve son 3–12 ayı seç.",
  howto_3: "Excel veya CSV olarak indir ya da bankanın e-postayla gönderdiği PDF ekstreyi kullan. Tüm dosyaları birlikte buraya bırak.",
  howto_tip: "Ay arttıkça bulunan artar: aylık bir çekim en az iki kez, yıllık bir çekim bir yıl arayla görünmeli.",

  reading: "{name} okunuyor…",
  reading_many: "{total} dosyadan {done} tanesi okunuyor…",
  err_empty: "{name} içinde işlem bulunamadı. Hesap hareketleri dosyası olduğundan emin misin?",
  err_columns: "{name} içinde tarih, açıklama ve tutar sütunları ayırt edilemedi.",
  err_scanned: "{name} taranmış bir görüntüye benziyor. Ekstreyi Excel veya CSV olarak indirmeyi dene.",
  err_password: "{name} parola korumalı.",
  err_password_wrong: "Bu parola {name} dosyasını açmadı.",
  err_broken: "{name} açılamadı. Dosya bozuk olabilir.",
  err_unsupported: "{name} Subtotal'ın okuyabildiği bir biçimde değil. Excel, CSV ya da PDF kullan.",
  err_paste: "Yapıştırılan metinde işlem bulunamadı. Her satırda tarih, açıklama ve tutar olmalı.",
  password_title: "Bu PDF kilitli",
  password_text:
    "Bankalar e-postayla gönderilen ekstreleri çoğu zaman bir parolayla korur (örneğin kimlik ya da telefon numaranın bir kısmı). Parola yalnızca burada, tarayıcında dosyayı açmak için kullanılır.",
  password_label: "PDF parolası",
  password_open: "Aç",
  cancel: "Vazgeç",
  columns_title: "Hangi sütun ne?",
  columns_text: "{name} dosyasının ilk satırlarına bakarak sütunları seç.",
  col_date: "Tarih",
  col_text: "Açıklama",
  col_amount: "Tutar",
  col_use: "Bu sütunları kullan",
  col_none: "{n}. sütun",

  welcome_back: "Tekrar hoş geldin. Hatırlanan ekstrelerin {date} tarihine kadar. Yeni çekimleri ve zamları yakalamak için bu ayın ekstresini ekle.",
  sample_note: "Bu uydurma bir örnek. Kendi ekstreni bırakıp kendi aboneliklerini gör.",
  you_pay: "Yılda",
  per_year: "ödüyorsun",
  per_month_total: "ayda",
  subs_one: "abonelik",
  subs_other: "abonelik",
  rises_one: "zam",
  rises_other: "zam",
  coverage: "{count} ödeme · {start} – {end}",
  currency: "Para birimi",

  alert_rise: "{name} {pct} zamlandı: {date} tarihinde {from} → {to}.",
  alert_new: "Yeni: {name}, {date} tarihinden beri {cadence} {amount}. Yılda {yearly} eder.",
  alert_twin: "{name} her dönemde birden fazla kez çekiliyor. İki hesap mı var, yoksa çift çekim mi?",
  alert_short:
    "Bu dosyalar yalnızca {days} günü kapsıyor; bu yüzden sadece Subtotal'ın adından tanıdığı servisler bulunabilir. Gerisini yakalamak için 2–3 ay daha ekle.",
  alert_none: "Bu ödemelerde abonelik bulunamadı. Daha fazla ay ya da aboneliklerini ödediğin kartı eklemeyi dene.",

  cad_weekly: "haftalık",
  cad_biweekly: "2 haftada bir",
  cad_monthly: "aylık",
  cad_quarterly: "3 ayda bir",
  cad_semiannual: "6 ayda bir",
  cad_yearly: "yıllık",
  per_weekly: "/hafta",
  per_biweekly: "/2 hafta",
  per_monthly: "/ay",
  per_quarterly: "/3 ay",
  per_semiannual: "/6 ay",
  per_yearly: "/yıl",
  per_year_short: "{amount}/yıl",
  next: "sonraki {date}",
  last: "son {date}",
  badge_new: "Yeni",
  badge_rise: "+{pct}",
  badge_drop: "{pct}",
  badge_once: "Bir kez görüldü",
  badge_varies: "Tutar değişken",
  badge_twin: "İki kez çekiliyor",
  once_hint: "Bu ekstrelerde bir kez görüldü. Yeni aylar eklenene kadar {cadence} varsayıldı.",
  varies_hint: "Tutar her seferinde biraz değişiyor; bu genellikle döviz üzerinden faturalandığını gösterir.",

  keep: "Kalsın",
  cancel_it: "İptal et",
  manage: "Yönet",
  hide: "Abonelik değil",
  restore: "Geri getir",
  add_it: "Bu bir abonelik",
  charges_one: "1 ödeme",
  charges_other: "{n} ödeme",
  savings: "{n} aboneliği iptal edersen yılda {yearly} (ayda {monthly}) tasarruf edersin.",
  savings_one: "1 aboneliği iptal edersen yılda {yearly} (ayda {monthly}) tasarruf edersin.",

  possible_title: "Göz atmaya değer ({n})",
  possible_hint: "Bunlar tekrarlıyor ama emin olmak için henüz yeterince sık görünmedi.",
  stopped_title: "Artık çekilmeyenler ({n})",
  stopped_hint: "Önceden düzenli çekiliyordu, son zamanlarda çekilmedi. İptal ettiysen iyi haber.",
  hidden_title: "Gizlenenler ({n})",

  ics: "Yenileme hatırlatıcılarını takvimime ekle",
  ics_done: "Takvim dosyası kaydedildi. Hatırlatıcıları eklemek için dosyayı aç.",
  ics_renews: "{name} yenileniyor · {amount}",
  ics_cancel: "{name} yenilenmeden iptal et ({amount})",
  ics_desc: "Subtotal ekstrende buldu. Hatırlatma 2 gün önce.",
  copy: "Özeti kopyala",
  copied: "Kopyalandı",
  share: "Paylaş",
  add_more: "Başka ekstre ekle",
  reset: "Baştan başla",
  summary_head: "Subtotal: {n} abonelik, ayda {monthly} (yılda {yearly})",
  summary_foot: "Tarayıcımda, hiçbir yere yüklemeden buldum: {url}",

  remember_ask: "Bu ödemeler bu cihazda hatırlansın mı? Gelecek ay sadece yeni ekstreyi bırakman yeterli; Subtotal neyin değiştiğini gösterir.",
  remember_yes: "Hatırla",
  remember_no: "Şimdi değil",
  remembered: "Yalnızca bu cihazda hatırlanıyor.",
  forget: "Her şeyi unut",
  forgotten: "Subtotal'ın hatırladığı her şey bu cihazdan silindi.",

  how_title: "Nasıl çalışır?",
  how_1_t: "1. Ekstreni bırak",
  how_1:
    "Herhangi bir bankanın ya da kartın Excel, CSV veya PDF dosyası, hangi dilde olursa olsun. Subtotal tarih, açıklama ve tutar sütunlarını kendisi bulur ve birkaç ayı birlikte okur.",
  how_2_t: "2. Tekrarlayanları bulur",
  how_2:
    "Aynı firmaya haftalık, aylık ya da yıllık bir düzenle, benzer tutarlarla yapılan ödemeler aboneliktir. Netflix, Spotify ya da iCloud gibi 60'tan fazla servis tek bir çekimden tanınır.",
  how_3_t: "3. Karar ver, hatırlatıcı kur",
  how_3:
    "Yıllık toplamı, zamları ve ücretliye dönen denemeleri gör. İptal edeceklerini işaretle, yenileme hatırlatıcılarını kendi takvimine ekle.",
  privacy_title: "Ekstren bu cihazdan hiç çıkmaz",
  privacy_1: "Sunucu yok: dosya bu tarayıcı sekmesindeki JavaScript tarafından okunur.",
  privacy_2: "Sıkı bir içerik güvenlik politikası (CSP) bu sayfanın herhangi bir yere veri göndermesini engeller. Tarayıcının geliştirici araçlarından kontrol edebilirsin.",
  privacy_3: "Banka girişi yok, üyelik yok, takip yok, reklam yok. İlk ziyaretten sonra internetsiz de çalışır.",
  faq_title: "Sorular",
  faq_1_q: "Neden banka uygulamama bakmıyorum?",
  faq_1_a:
    "Banka uygulamaları her ödemeyi listeler ama onları gruplamaz, Netflix'in %37 zamlandığını fark etmez ve tüm aboneliklerinin yıllık toplamını çıkarmaz. Subtotal bunları birkaç kart ve banka için birlikte yapar.",
  faq_2_q: "Ekstremi burada açmak güvenli mi?",
  faq_2_a:
    "Evet. Hiçbir şey yüklenmez: sayfanın yükleme yapacağı bir sunucu yok ve tarayıcı veri göndermesini engeller. Kaynak kodu GitHub'da açık.",
  faq_3_q: "Bir aboneliği kaçırdı. Neden?",
  faq_3_a:
    "Aylık bir çekimin en az iki kez görünmesi, yıllık bir çekimin ise bir yıl arayla iki ekstrede olması gerekir. Daha fazla ay ekle. App Store ya da Google Play üzerinden ödenenler Apple ya da Google olarak görünür.",

  footer_privacy:
    "Her şey tarayıcının içinde olur. Sıkı bir güvenlik politikası (CSP) bu sayfanın ekstreni herhangi bir yere göndermesini engeller: tarayıcının geliştirici araçlarından kontrol edebilir ya da Wi-Fi'ı kapatıp kullanmaya devam edebilirsin.",
  footer_source: "GitHub'da kaynak kodu",
  footer_license: "MIT lisanslı",
  install: "Uygulamayı yükle",
  lang_name: "English",

  cat_video: "Video",
  cat_music: "Müzik",
  cat_apps: "Uygulama mağazası",
  cat_cloud: "Bulut depolama",
  cat_ai: "Yapay zekâ",
  cat_software: "Yazılım",
  cat_learning: "Eğitim",
  cat_dating: "Arkadaşlık",
  cat_gaming: "Oyun",
  cat_reading: "Okuma",
  cat_security: "Güvenlik",
  cat_fitness: "Sağlık ve spor",
  cat_bills: "Faturalar",
  cat_creators: "İçerik üreticileri",
  cat_other: "Diğer",
};

export type Lang = "en" | "tr";
const dictionaries: Record<Lang, Record<Key, string>> = { en, tr };
const STORAGE_KEY = "subtotal:lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "tr") return saved;
  } catch {
    // storage blocked (private mode etc.)
  }
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

let current: Lang = initialLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not fatal
  }
}

export function locale(): string {
  return current === "tr" ? "tr-TR" : navigator.language.toLowerCase().startsWith("en") ? navigator.language : "en-US";
}

export function t(key: Key, params: Record<string, string | number> = {}): string {
  return dictionaries[current][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ""));
}

export function plural(n: number, one: Key, other: Key): string {
  return t(n === 1 ? one : other, { n });
}
