#Import the base Alpine image
FROM alpine:3.15.4

WORKDIR /opt/bin

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs npm

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
ADD ./libs ./libs
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]
