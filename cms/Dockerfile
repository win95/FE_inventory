FROM node:24-alpine

WORKDIR /opt/app

# Không cần toolchain build (python/make/g++): không có dependency nào biên
# dịch native trong `npm ci` — sharp dùng binary có sẵn cho linuxmusl-x64,
# better-sqlite3 chỉ là peerDependency optional của knex (không được cài),
# còn Strapi trong Compose dùng Postgres (`pg` thuần JS).
# (Bỏ `apk add` cũng bỏ luôn điểm lỗi DNS của dl-cdn.alpinelinux.org.)

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
