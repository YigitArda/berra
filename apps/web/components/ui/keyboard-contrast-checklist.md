# UI Accessibility Checklist (Keyboard Navigation + Contrast)

## Keyboard Navigation

- [ ] Tüm etkileşimli elemanlar (`button`, `a`, `input`, custom control) yalnızca klavye ile erişilebilir.
- [ ] Tab sırası görsel akışla uyumlu ve beklenebilir.
- [ ] `focus-visible` stilleri net, yüksek kontrastlı ve her variant/size için görünür.
- [ ] `Enter` ve `Space` davranışları buton ve buton-benzeri kontrollerde doğru çalışır.
- [ ] Form içinde `label` + `htmlFor` ilişkisi tüm input alanlarında mevcuttur.
- [ ] Hata durumunda `aria-invalid="true"` set edilir.
- [ ] Yardım/hata/başarı metinleri `aria-describedby` ile input'a bağlanır.
- [ ] Escape/Arrow key gibi özel klavye davranışı olan bileşenler (dropdown, combobox, dialog) beklendiği gibi kapanır/gezinir.

## Contrast

- [ ] Normal metin kontrastı en az **4.5:1**.
- [ ] Büyük metin (>= 18pt ya da 14pt bold) kontrastı en az **3:1**.
- [ ] Focus ring, çevre arka planla en az **3:1** kontrasta sahip.
- [ ] Error/success/neutral badge ve form mesaj renkleri koyu tema üzerinde ayırt edilebilir.
- [ ] Placeholder metinleri okunabilir ancak asıl içerikten daha baskın değil.
- [ ] Disabled durumlar anlaşılır ancak kritik bilgi sadece renkle verilmez.
- [ ] Hover, active, selected durumları kontrast kaybına uğramaz.

## Quick Verification

- [ ] Sadece `Tab`/`Shift+Tab` ile form baştan sona dolaşılabildi.
- [ ] Bir alan hata verdiğinde ekran okuyucu hata metnine bağlanıyor (`aria-describedby`).
- [ ] Renk körlüğü simülasyonunda state farkları (error/success/info) korunuyor.
