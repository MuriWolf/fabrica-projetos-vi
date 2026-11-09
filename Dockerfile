FROM node:24-alpine AS build
WORKDIR /app
COPY --link package.json package-lock.json ./
RUN npm ci
COPY --link . .
# Keep the build working when there is no local .env (defaults apply).
RUN [ -f .env ] || touch .env
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --link --from=build /app/.output ./.output
COPY --link --from=build /app/.env ./.env
USER node
EXPOSE 3000
CMD ["node", "--env-file=.env", ".output/server/index.mjs"]
