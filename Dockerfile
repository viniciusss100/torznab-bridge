FROM node:22-alpine

RUN apk update && apk upgrade && apk add --no-cache git curl

WORKDIR /home/node/app

COPY addon/package*.json ./
RUN npm ci --omit=dev

COPY addon/ ./

CMD ["node", "torznab/index.js"]
