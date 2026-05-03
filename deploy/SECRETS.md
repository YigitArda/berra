# Staging Secret YÃ¶netimi

Bu proje `GitHub Environments` + Kubernetes secret kombinasyonu kullanÄ±r.

## 1) GitHub Environment (staging)

`Settings -> Environments -> staging` altÄ±nda:

- `KUBE_CONFIG_STAGING`
- `REGISTRY_TOKEN` (opsiyonel, GHCR harici registry iÃ§in)

Bu sayede CD workflow sadece `staging` environment onayÄ± ile secret okuyabilir.

## 2) Kubernetes Secret

Cluster iÃ§inde `araba-staging` namespace altÄ±nda `araba-secrets` bulunmalÄ±:

```bash
kubectl -n araba-staging create secret generic araba-secrets \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=JWT_SECRET='...'
```

Uygulama deploymentâ€™larÄ± bu secretâ€™tan `valueFrom.secretKeyRef` ile beslenir.

## 3) Rotasyon

- JWT secret rotasyonundan sonra API + Worker rollout zorunludur.
- DB/Redis credential rotasyonundan sonra ilgili deploymentâ€™lar restart edilmelidir.
