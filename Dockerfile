# Tahap 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Tahap 2: Build aplikasi
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Tahap 3: Runner (Lingkungan produksi)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Salin file standalone yang sudah di-build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080

CMD ["node", "server.js"]