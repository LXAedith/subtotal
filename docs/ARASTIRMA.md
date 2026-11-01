# Subtotal neden var?

*Kasım 2026. English: [RESEARCH.md](RESEARCH.md)*

## Sorun

İnsanlar sandıklarından fazla aboneliğe para ödüyor ve tutarlar kimse fark etmeden artıyor.

| Bulgu | Kaynak |
| --- | --- |
| İnsanlar aylık abonelik harcamalarını ortalama **133 $** eksik tahmin ediyor. %42'si kullanmayı bıraktığı bir hizmete hâlâ ödeme yaptığını söylüyor. | C+R Research, ABD'de 1.000 yetişkinle anket ([NBC](https://www.nbcwashington.com/news/business/money-report/consumers-spend-an-average-133-more-each-month-on-subscriptions-than-they-realize-study-shows/3067565/)) |
| CNET/YouGov'un 2025'te 2.440 kişiyle yaptığı ankete göre yalnızca Z kuşağı unutulan ya da kullanılmayan aboneliklere ayda yaklaşık **23 $** harcıyor. | [CordCutters News](https://cordcuttersnews.com/americans-spend-over-200-a-year-on-unused-subscriptions-here-is-how-to-easily-stop-them/) |
| Netflix Türkiye 2026'da iki kez zam yaptı: Haziran'da yaklaşık **%26**, Ekim'de bir kez daha (Temel paket 189,99 → 259,99 TL). Çoğu kişi bunu ancak ekstrede, o da fark ederse görüyor. | [Paratic](https://paratic.com/netflix-sessizce-zam-yapti-fiyatlar-yuzde-26-artti/), [Gazete Oksijen](https://gazeteoksijen.com/ekonomi/netflix-turkiye-abonelik-ucretlerine-zam-yapti-iste-yeni-fiyatlar-291569) |
| Gerçek şikâyetler: bir kullanıcı **her ay 399 TL** çekildiğini ancak ekstrelerini okuyunca fark etmiş. Başkaları deneme süresinden ya da iptalden sonra fark etmedikleri 999 TL ve 252 TL'lik çekimleri anlatıyor. | Şikâyetvar: [1](https://www.sikayetvar.com/yapi-kredi-bankasi/cv-marker-aboneliginin-izinsiz-cekimi-ve-iptal-edilememesi), [2](https://www.sikayetvar.com/mindguru/izinsiz-cekilen-999-tl-icin-geri-odeme-ve-abonelik-iptali-talebi), [3](https://www.sikayetvar.com/betterme/iptal-edilen-abonelik-sonrasi-izinsiz-252-tl-cekimi-ve-kart-bilgisi-silinmesi-talebi) |
| En bilinen abonelik bulucu, Plaid üzerinden banka girişi istiyor. Bir derlemede banka bağlama döngüsüyle ilgili yaklaşık **150 yorum** var. | [Unstar](https://unstar.app/blog/rocket-money-wont-link-bank-account-loop-reviews-2026) |

Cevap zaten herkesin ekstresinde duruyor. Sadece yüzlerce market ve akaryakıt ödemesinin arasında kaybolmuş, birkaç karta ve aya dağılmış durumda.

## Bugün ne var?

| Araç | Nasıl çalışır? | Eksik |
| --- | --- | --- |
| Rocket Money, Monarch, Copilot, Emma | Plaid ya da açık bankacılıkla bankana bağlanır | Banka girişi ister; ücretli paketler var; yalnızca ABD/İngiltere/AB'de çalışır. Türk bankalarıyla hiç çalışmaz. |
| SubFind, Unsubbed, StatementDecoder, Monavio | Ekstreni kendi sunucularına yüklersin | Tüm ekstren başkasının sunucusuna gider. |
| SubTracker, Bobby, RecurDash gibi elle girilen takipçiler | Aboneliklerini kendin yazarsın | Unuttuğun aboneliği bulamaz; asıl mesele de bu. |
| [LowerMySubs](https://www.lowermysubs.com/scan), [Triimly](https://triimly.floot.app/) | Ekstreyi tarayıcıda tarar | Kapalı kaynak; ABD tarzı CSV biçimleri; PDF ekstre yok; aylar arasında hafıza yok. |
| [refund-radar](https://github.com/andreolf/refund-radar), [SubZero](https://github.com/Sumama-Jameel/subzero) | Açık kaynak betikler | Python ya da sunucu gerektirir; sıradan kullanıcıya göre değil. |
| Banka uygulamaları | Her işlemi gösterir | Çekimleri gruplamaz, zamları fark etmez, yıllık toplam çıkarmaz; her seferinde tek banka. |

Subtotal'ın doldurduğu boşluk:

- **Banka girişi ve yükleme yok.** Ekstre tarayıcıda okunur; sayfanın içerik güvenlik politikası herhangi bir yere veri göndermesini engeller.
- **Her bankanın dosyası.** Excel (.xlsx ve eski .xls), her kodlama ve ayraçta CSV, PDF ekstre, bazı internet şubelerinin ürettiği HTML biçimli Excel dosyaları ve internet şubesinden yapıştırılan metin. Türk biçimleri (`1.234,56`, `05.10.2026`, Windows-1254, "İşlem Tarihi / Açıklama / Tutar") tam destekleniyor.
- **Sadece liste değil, zamlar ve ücretliye dönen denemeler** de gösteriliyor.
- **Geri gelmek için bir neden:** kullanıcı izin verirse geçmiş ayları cihazda hatırlar; gelecek ay sadece yeni ekstreyi bırakmak yeter.

## Karar hakkında dürüst bir not

Subtotal, bir şey inşa etmeden önce fikirleri puanlayan bir rutinle yapıldı (sıklık, şiddet, kanıt, boşluk, yapılabilirlik, alışkanlık, paylaşılabilirlik; kapı 26/35). Bu fikir **25/35** aldı: kanıt ve boşluk güçlü, ama insanlar ekstreye haftada bir değil ayda bir bakıyor. Rutinin sahibi yine de yapılmasına karar verdi. Ayda bir kullanım bir para aracı için makul bir ritim ve Türk bankaları tarafındaki boşluğun iyi bir cevabı yoktu.

## Tasarım kararları

- **10 saniyede değer:** örnek ekstre, kimse bir şey indirmeden tüm sonucu gösterir.
- **Üç adım:** ekstreyi bırak → abonelikleri gör → kalsın/iptal işaretle ve yenileme hatırlatıcılarını kendi takvimine ekle. Takvim bir `.ics` dosyasıyla eklenir; hatırlatmalar bizden değil, kullanıcının kendi takviminden gelir.
- **Karanlık örüntü yok:** hesap, reklam, analitik ve bildirim yok. Hafıza isteğe bağlı ve tek tuşla silinebilir.
