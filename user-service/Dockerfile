FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json .

RUN npm install

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY . . 

RUN apk add --no-cache dumb-init

RUN npm install pm2 -g

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

USER nodeuser

EXPOSE 3006

CMD ["dumb-init", "--", "pm2-runtime", "start", "npm", "--", "start"]