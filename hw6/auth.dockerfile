FROM node:19-alpine

# add curl to image
RUN apk --no-cache add curl

WORKDIR /app
COPY package.json .

RUN npm install

COPY . .

CMD ["node", "src/auth.js"]

EXPOSE 8001