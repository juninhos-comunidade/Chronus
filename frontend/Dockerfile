FROM oven/bun:1.1.38-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install

FROM deps AS builder
ARG VITE_API_BASE_URL=https://api.chronus.com.br
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY .env* ./
COPY . .
RUN bun run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
