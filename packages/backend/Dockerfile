FROM oven/bun:1.1.38-alpine AS runner
WORKDIR /app/packages/backend
RUN addgroup --system --gid 1001 bunjs && \
    adduser  --system --uid 1001 bunjs

COPY --chown=bunjs:bunjs packages/backend/package.json ./package.json
RUN bun install --production

COPY --chown=bunjs:bunjs packages/backend/ .

RUN mkdir -p /app/packages/backend/uploads && \
    chown -R bunjs:bunjs /app/packages/backend/uploads

USER bunjs
EXPOSE 3001
ENV NODE_ENV=production \
    PORT=3001 \
    LOG_PRETTY=false

CMD ["./docker-entrypoint.sh"]