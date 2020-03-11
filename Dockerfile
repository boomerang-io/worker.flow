#Import the base docker image built on top of Alpine
#FROM alpine:3.9
FROM ubuntu:18.04

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs npm

WORKDIR /cli
ADD ./cli.js ./log.js ./error.js ./utils.js ./config.js ./package.json ./
ADD ./commands ./commands
RUN npm install

ENTRYPOINT [ "node", "cli" ]
