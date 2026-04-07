FROM node:20-alpine
WORKDIR /app

# Monorepo root'dan install
COPY package*.json ./
COPY turbo.json ./
RUN npm install

# Web app build
COPY apps/web ./apps/web
RUN cd apps/web && npm run build

EXPOSE 3000
CMD ["node", "apps/web/dist/server.js"]
