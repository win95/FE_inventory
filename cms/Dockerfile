FROM node:24-alpine

WORKDIR /opt/app

# better-sqlite3 (phụ thuộc của Strapi core) cần toolchain để build native.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 1337

CMD ["npm", "run", "start"]
