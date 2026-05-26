FROM oven/bun:1.1.38-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY packages/admin-frontend/package.json ./packages/admin-frontend/
RUN bun install

FROM deps AS builder
ARG VITE_API_BASE_URL=https://api.chronus.com.br
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY packages/admin-frontend/.env* ./packages/admin-frontend/
COPY packages/admin-frontend ./packages/admin-frontend
WORKDIR /app/packages/admin-frontend
RUN bun run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/packages/admin-frontend/dist /usr/share/nginx/html
COPY packages/admin-frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]