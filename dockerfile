FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json .

RUN npm install

COPY src ./src

COPY index.html .

COPY vite.config.ts .

COPY tailwind.config.js .

COPY postcss.config.js .

COPY tsconfig*.json . 

RUN npm run build

FROM nginx:alpine AS runner

WORKDIR /app

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html/

RUN chown -R nginx:nginx /usr/share/nginx/html \
    /var/cache/nginx \
    /var/run

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

