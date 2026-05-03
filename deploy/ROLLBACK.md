# Staging Rollback PlanÄ±

## HÄ±zlÄ± rollback (image tag)

CD workflow `workflow_dispatch` ile `rollback_to` parametresi alÄ±r.
Ã–rnek:

- `rollback_to=sha-a1b2c3d`

Workflow API/Web/Worker deployment imageâ€™larÄ±nÄ± bu tagâ€™e set eder.

## Manuel rollback (kubectl)

```bash
kubectl -n araba-staging rollout undo deployment/araba-api
kubectl -n araba-staging rollout undo deployment/araba-web
kubectl -n araba-staging rollout undo deployment/araba-worker
```

## DB migration rollback notu

Migration rollback her zaman otomatik gÃ¼venli deÄŸildir.

- Ã–ncelik: backward-compatible migration uygulamak.
- Gerekirse `prisma migrate resolve` ve hotfix migration ile ileri dÃ¼zeltme tercih edilir.
- Kritik durumda rollback Ã¶ncesi DB snapshot geri dÃ¶nÃ¼ÅŸ planÄ± uygulanmalÄ±dÄ±r.
