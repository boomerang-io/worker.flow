#Import the base Alpine image
FROM alpine:3.13.5

WORKDIR /opt/bin

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs npm

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]
