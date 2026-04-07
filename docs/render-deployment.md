# Render Deployment Guide

This document describes how to deploy the Berra API to [Render](https://render.com).

## Quick Start (Blueprint Deployment)

The repository includes a `render.yaml` file that enables one-click Blueprint deployment.

### Steps:

1. **Push your code to GitHub**
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create a new Blueprint on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   The following environment variables need to be set manually in the Render dashboard:
   
   | Variable | Description | Required |
   |----------|-------------|----------|
   | `DATABASE_URL` | PostgreSQL connection string | Yes |
   | `JWT_SECRET` | Secret key for JWT signing | Yes |
   | `REDIS_URL` | Redis connection URL (for BullMQ) | No |
   | `WEB_URL` | Frontend URL for CORS | No |

4. **Deploy**
   - Click "Apply" to deploy your services
   - Render will automatically build and deploy the API

---

## Manual Deployment (Without Blueprint)

If you prefer to create services manually:

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

   | Setting | Value |
   |---------|-------|
   | Name | `berra-api` (or your preference) |
   | Root Directory | `apps/api` |
   | Runtime | `Node` |
   | Build Command | `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm prisma generate && pnpm build` |
   | Start Command | `pnpm start` |

5. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (Render will override this)
   - `DATABASE_URL`: Your database URL
   - `JWT_SECRET`: Your JWT secret

6. Click "Create Web Service"

### 2. Create PostgreSQL Database (Optional)

1. Click "New" → "PostgreSQL"
2. Configure the database
3. Copy the "Internal Database URL" or "External Database URL"
4. Add it as `DATABASE_URL` environment variable to your web service

---

## Build & Start Commands Explained

### Build Command

```bash
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm prisma generate && pnpm build
```

1. `npm install -g pnpm` - Installs pnpm globally
2. `pnpm install --frozen-lockfile` - Installs dependencies from lock file
3. `pnpm prisma generate` - Generates Prisma client
4. `pnpm build` - Builds the NestJS application

### Start Command

```bash
pnpm start
```

Runs `node dist/main.js` to start the NestJS application.

---

## Health Check

The API includes a health check endpoint at `/health` that Render uses to verify the service is running.

---

## Troubleshooting

### Build Failures

1. **Check pnpm is available**: The build command installs pnpm globally first
2. **Verify lock file**: Ensure `pnpm-lock.yaml` is committed to git
3. **Check Node version**: Render uses Node 18+ by default

### Database Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Ensure the database is in the same region as your web service for better performance
3. Check database firewall rules allow connections from Render

### Memory Issues

If you encounter memory issues during build:
- Upgrade to a paid plan with more memory
- Or add `NODE_OPTIONS=--max-old-space-size=4096` to environment variables

---

## Custom Domain (Optional)

1. In Render Dashboard, go to your web service
2. Click "Settings" → "Custom Domain"
3. Follow the instructions to add your domain

---

## Related Files

- `render.yaml` - Render Blueprint configuration
- `apps/api/package.json` - API dependencies and scripts
- `apps/api/railway.toml` - Alternative Railway deployment config
