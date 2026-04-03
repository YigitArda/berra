# UI Stabilization Playbook

## 1) Bug triage ve önceliklendirme

- **P0:** kullanıcı akışını kıran hatalar (login/logout, feed gönderme, navigation).
- **P1:** yanlış davranış, workaround var.
- **P2:** görsel/UX tutarsızlığı.

### Kritik akışlar (öncelikli)

1. Feed gönderimi ve liste yenileme
2. Bildirim badge ve nav davranışı
3. Oturuma göre header aksiyonları (Çıkış/Giriş)

## 2) Reprodüksiyon checklist'i

Her bug kaydı şu alanları içermelidir:

- Adım adım reproduction
- Beklenen sonuç
- Gerçekleşen sonuç
- Environment (tarayıcı, viewport, auth durumu)
- Ekran kaydı/screenshot

## 3) Hızlı kazanım düzeltmeleri

- Form doğrulama, disabled/loading/empty state mesajlarının tutarlı kullanımı
- Header/nav aktif durum + odak görünürlüğü için tek pattern

## 4) Regression test kuralı

- Her UI bug fix için **en az 1 regression testi** zorunludur.
- Test tipleri:
  - Integration test (kritik kullanıcı akışları)
  - Unit test (UI state/utility)

## 5) PR gate

Aşağıdaki komutlar PR aşamasında geçmelidir:

- `pnpm --filter @berra/web lint`
- `pnpm --filter @berra/web typecheck`
- `pnpm --filter @berra/web test`

## 6) Haftalık çalışma modeli

- Pazartesi: triage + sprint plan
- Çarşamba: ara kalite kontrol (test/a11y)
- Cuma: demo + retro + metrikler

## 7) Definition of Done (UI)

- Repro doğrulandı
- Regression test eklendi
- Lint + typecheck + test geçti
- A11y kritik maddeleri sağlandı
