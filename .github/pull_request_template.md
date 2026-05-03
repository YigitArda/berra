## Summary

-

## UI Stabilization Checklist

- [ ] Reproduction adÄ±mlarÄ± issue iÃ§inde net ÅŸekilde yazÄ±ldÄ±.
- [ ] Bu dÃ¼zeltme iÃ§in en az 1 regression test eklendi ya da gÃ¼ncellendi.
- [ ] Klavye ile eriÅŸilebilirlik kontrolÃ¼ yapÄ±ldÄ± (Tab/Shift+Tab, focus-visible).
- [ ] `aria-invalid` / `aria-describedby` iliÅŸkileri gerekiyorsa doÄŸrulandÄ±.
- [ ] BoÅŸ / yÃ¼kleniyor / hata durumlarÄ± doÄŸrulandÄ±.

## Validation

- [ ] `pnpm --filter @araba/web lint`
- [ ] `pnpm --filter @araba/web typecheck`
- [ ] `pnpm --filter @araba/web test`
