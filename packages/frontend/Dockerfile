FROM oven/bun:1.1.38-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
COPY packages/frontend/package.json ./packages/frontend/
RUN bun install

FROM deps AS builder
ARG VITE_API_BASE_URL=https://api.chronus.com.br
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY packages/frontend/.env* ./packages/frontend/
COPY packages/frontend ./packages/frontend
WORKDIR /app/packages/frontend
RUN bun run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/conf.d/default.conf.default
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]