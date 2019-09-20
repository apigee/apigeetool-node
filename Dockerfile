FROM node:alpine as builder

## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache make g++
RUN npm install [ your npm dependencies here ]

FROM node:alpine as app

## Copy built node modules and binaries without including the toolchain
COPY --from=builder node_modules .

WORKDIR /app
COPY package.json /app
RUN npm install apigetool
COPY . /app
