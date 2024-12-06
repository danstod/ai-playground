FROM node:14-alpine AS builder

RUN mkdir -p /app
WORKDIR /app

COPY package.json  .
#COPY yarn.lock .
RUN npm install
#RUN yarn install

COPY . .

EXPOSE 80
CMD [ "npm", "run", "start" ]
