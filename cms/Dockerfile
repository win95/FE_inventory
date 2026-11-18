FROM node:24-alpine

WORKDIR /opt/app

# Toolchain dự phòng: sharp (xử lý ảnh của Strapi) thường dùng binary có sẵn,
# nhưng nếu phải build từ source thì cần python/make/g++.
# better-sqlite3 KHÔNG có trong image này — nó chỉ phục vụ chạy thử bằng
# SQLite trên host (xem README), còn trong Compose Strapi dùng Postgres.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
