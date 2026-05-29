FROM oven/bun:1.1.38-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 bunjs && \
    adduser  --system --uid 1001 bunjs

COPY --chown=bunjs:bunjs package.json ./
RUN bun install --production

COPY --chown=bunjs:bunjs . .

RUN mkdir -p /app/uploads && \
    chown -R bunjs:bunjs /app/uploads

USER bunjs
EXPOSE 3001
ENV NODE_ENV=production \
    PORT=3001 \
    LOG_PRETTY=false

CMD ["./docker-entrypoint.sh"]
