#Import the base Alpine image
FROM node:22.22.0-alpine

WORKDIR /opt/bin

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils python3 make g++

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
ADD ./libs ./libs
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]