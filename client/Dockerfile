FROM node:18-alpine

ENV BASE_DIR=/var/www/crucible/

WORKDIR ${BASE_DIR}/client

COPY package.json yarn.lock* ./

RUN apk add --no-cache autoconf automake libc6-compat mesa-dev mesa libxi build-base gcc libtool nasm jpeg-dev zlib-dev

RUN yarn install

EXPOSE 5173

CMD yarn && yarn dev