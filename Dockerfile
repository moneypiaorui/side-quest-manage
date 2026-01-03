FROM node:20-alpine AS build
WORKDIR /app
ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.1.2 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
