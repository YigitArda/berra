# UI Stabilization Playbook

## 1) Bug triage ve Ã¶nceliklendirme

- **P0:** kullanÄ±cÄ± akÄ±ÅŸÄ±nÄ± kÄ±ran hatalar (login/logout, feed gÃ¶nderme, navigation).
- **P1:** yanlÄ±ÅŸ davranÄ±ÅŸ, workaround var.
- **P2:** gÃ¶rsel/UX tutarsÄ±zlÄ±ÄŸÄ±.

### Kritik akÄ±ÅŸlar (Ã¶ncelikli)

1. Feed gÃ¶nderimi ve liste yenileme
2. Bildirim badge ve nav davranÄ±ÅŸÄ±
3. Oturuma gÃ¶re header aksiyonlarÄ± (Ã‡Ä±kÄ±ÅŸ/GiriÅŸ)

## 2) ReprodÃ¼ksiyon checklist'i

Her bug kaydÄ± ÅŸu alanlarÄ± iÃ§ermelidir:

- AdÄ±m adÄ±m reproduction
- Beklenen sonuÃ§
- GerÃ§ekleÅŸen sonuÃ§
- Environment (tarayÄ±cÄ±, viewport, auth durumu)
- Ekran kaydÄ±/screenshot

## 3) HÄ±zlÄ± kazanÄ±m dÃ¼zeltmeleri

- Form doÄŸrulama, disabled/loading/empty state mesajlarÄ±nÄ±n tutarlÄ± kullanÄ±mÄ±
- Header/nav aktif durum + odak gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼ iÃ§in tek pattern

## 4) Regression test kuralÄ±

- Her UI bug fix iÃ§in **en az 1 regression testi** zorunludur.
- Test tipleri:
  - Integration test (kritik kullanÄ±cÄ± akÄ±ÅŸlarÄ±)
  - Unit test (UI state/utility)

## 5) PR gate

AÅŸaÄŸÄ±daki komutlar PR aÅŸamasÄ±nda geÃ§melidir:

- `pnpm --filter @araba/web lint`
- `pnpm --filter @araba/web typecheck`
- `pnpm --filter @araba/web test`

## 6) HaftalÄ±k Ã§alÄ±ÅŸma modeli

- Pazartesi: triage + sprint plan
- Ã‡arÅŸamba: ara kalite kontrol (test/a11y)
- Cuma: demo + retro + metrikler

## 7) Definition of Done (UI)

- Repro doÄŸrulandÄ±
- Regression test eklendi
- Lint + typecheck + test geÃ§ti
- A11y kritik maddeleri saÄŸlandÄ±
