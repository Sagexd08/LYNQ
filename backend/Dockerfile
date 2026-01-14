FROM node:24-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Use pnpm if pnpm-lock.yaml exists, otherwise npm
# Use npm install (not npm ci) to handle cases where package-lock.json may be out of sync
RUN if [ -f "pnpm-lock.yaml" ]; then \
      pnpm install --frozen-lockfile; \
    else \
      npm install --legacy-peer-deps; \
    fi

COPY . .

# Generate Prisma client BEFORE building (TypeScript needs it)
RUN if [ -f "pnpm-lock.yaml" ]; then \
      pnpm exec prisma generate; \
    else \
      npx prisma generate; \
    fi

# Now build the application
RUN if [ -f "pnpm-lock.yaml" ]; then \
      pnpm run build; \
    else \
      npm run build; \
    fi

FROM node:24-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/main.js"]
