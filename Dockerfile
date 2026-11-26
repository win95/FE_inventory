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
# P0 K8s FE + cache: GIT_SHA/IMAGE_TAG cho generateBuildId (BUILD_ID ổn định
# theo commit). CI truyền --build-arg GIT_SHA=<commit>; không truyền thì "dev".
ARG GIT_SHA
ARG IMAGE_TAG
ENV GIT_SHA=$GIT_SHA
ENV IMAGE_TAG=$IMAGE_TAG
RUN npm run build
# P0 K8s FE + cache: đảm bảo thư mục disk cache build-time luôn tồn tại
# để stage runner COPY không lỗi (khi không có entry nào được ghi lúc build).
RUN mkdir -p .next/cache/awing-multi-tier

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# P0 K8s FE + cache (§4.4 thiết kế): chạy bằng user không phải root
# (nodejs/nextjs, uid 1001) — chuẩn bảo mật tối thiểu của nhiều cluster
# (Pod Security Standards). Thư mục server cần ghi lúc chạy (disk cache
# .next/cache/awing-multi-tier) phải thuộc về user này.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# P0 K8s FE + cache: file handler + BUILD_ID + disk cache build-time không
# nằm trong standalone (Next chỉ trace server.js) nên copy thêm tay — nếu
# không, runtime không tìm thấy handler/BUILD_ID và disk L3 trống.
# mkdir -p ở builder đảm bảo thư mục disk luôn tồn tại để COPY không lỗi.
COPY --from=builder /app/cache-handlers ./cache-handlers
COPY --from=builder /app/.next/BUILD_ID ./.next/BUILD_ID
COPY --from=builder /app/.next/cache/awing-multi-tier ./.next/cache/awing-multi-tier
RUN mkdir -p .next/cache/awing-multi-tier \
 && chown -R nextjs:nodejs .next/cache ./cache-handlers
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
