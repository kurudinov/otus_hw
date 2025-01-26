FROM node:19-alpine

RUN apk --no-cache add curl

WORKDIR /app

COPY . ./

CMD node server.mjs

EXPOSE 8000