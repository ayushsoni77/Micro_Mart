FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine AS runner 

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nodeuser:nodejs /app/dist .

RUN rm -rf node_modules/.cache && \
    rm -rf /home/nodeuser/.npm

USER nodeuser

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
