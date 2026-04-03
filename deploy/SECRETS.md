# Staging Secret Yönetimi

Bu proje `GitHub Environments` + Kubernetes secret kombinasyonu kullanır.

## 1) GitHub Environment (staging)

`Settings -> Environments -> staging` altında:

- `KUBE_CONFIG_STAGING`
- `REGISTRY_TOKEN` (opsiyonel, GHCR harici registry için)

Bu sayede CD workflow sadece `staging` environment onayı ile secret okuyabilir.

## 2) Kubernetes Secret

Cluster içinde `berra-staging` namespace altında `berra-secrets` bulunmalı:

```bash
kubectl -n berra-staging create secret generic berra-secrets \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=JWT_SECRET='...'
```

Uygulama deployment’ları bu secret’tan `valueFrom.secretKeyRef` ile beslenir.

## 3) Rotasyon

- JWT secret rotasyonundan sonra API + Worker rollout zorunludur.
- DB/Redis credential rotasyonundan sonra ilgili deployment’lar restart edilmelidir.
