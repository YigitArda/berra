# Staging Rollback Planı

## Hızlı rollback (image tag)

CD workflow `workflow_dispatch` ile `rollback_to` parametresi alır.
Örnek:

- `rollback_to=sha-a1b2c3d`

Workflow API/Web/Worker deployment image’larını bu tag’e set eder.

## Manuel rollback (kubectl)

```bash
kubectl -n berra-staging rollout undo deployment/berra-api
kubectl -n berra-staging rollout undo deployment/berra-web
kubectl -n berra-staging rollout undo deployment/berra-worker
```

## DB migration rollback notu

Migration rollback her zaman otomatik güvenli değildir.

- Öncelik: backward-compatible migration uygulamak.
- Gerekirse `prisma migrate resolve` ve hotfix migration ile ileri düzeltme tercih edilir.
- Kritik durumda rollback öncesi DB snapshot geri dönüş planı uygulanmalıdır.
