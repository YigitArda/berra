## Summary

- 

## UI Stabilization Checklist

- [ ] Reproduction adımları issue içinde net şekilde yazıldı.
- [ ] Bu düzeltme için en az 1 regression test eklendi ya da güncellendi.
- [ ] Klavye ile erişilebilirlik kontrolü yapıldı (Tab/Shift+Tab, focus-visible).
- [ ] `aria-invalid` / `aria-describedby` ilişkileri gerekiyorsa doğrulandı.
- [ ] Boş / yükleniyor / hata durumları doğrulandı.

## Validation

- [ ] `pnpm --filter @berra/web lint`
- [ ] `pnpm --filter @berra/web typecheck`
- [ ] `pnpm --filter @berra/web test`
