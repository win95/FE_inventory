# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Repo hiện chưa có thư mục public/ (favicon là src/app/icon.svg, ảnh qua
# CMS) nên tạo sẵn thư mục rỗng — nếu không, COPY /app/public ở stage
# runner sẽ lỗi "not found" vì Docker COPY yêu cầu thư mục nguồn tồn tại.
RUN mkdir -p public
# NEXT_PUBLIC_* được nhúng vào bundle lúc build nên phải truyền qua build arg.
# Mặc định trỏ về localhost để chạy local; khi deploy thật thì truyền URL công khai.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
