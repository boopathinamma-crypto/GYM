FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json ./

FROM base AS dependencies
RUN npm ci --only=production

FROM base AS development
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs
EXPOSE 5000
USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
