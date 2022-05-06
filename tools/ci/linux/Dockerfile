# FROM gcr.io/gcp-runtimes/ubuntu_18_0_4

# Alternative base image when testing on a  standard local linux machine. (kokoro?)
# FROM ubuntu:18.04 as base

# FROM node:12.22.6 as base

FROM node:16 as nodebase
FROM ubuntu:18.04 as base
COPY --from=nodebase / /

################################################################################
# Core packages required to fetch toolchains
################################################################################
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     ca-certificates \
#     nodejs \
#     npm \
#     sudo \
#     && \
#     rm -rf /var/lib/apt/lists/*

WORKDIR /code

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY .npmrc .npmrc

FROM base as test

# I could not get npm to update as I needed it.
# RUN npm config set registry http://registry.npmjs.org/
# RUN npm install npm@8.3.0 -g

RUN npm install
COPY . .

# run tests during image build
RUN npm run test
#RUN npm run remotetest
