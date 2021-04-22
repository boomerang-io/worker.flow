#Import the base Alpine image
FROM alpine:3.11.3

WORKDIR /opt/bin

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs npm python3

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]
