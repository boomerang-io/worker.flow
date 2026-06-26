#Import the base Alpine image
FROM node:22-alpine3.24

WORKDIR /opt/bin

# Ensure npm's bundled dependencies include fixed brace-expansion versions.
RUN npm install -g npm@11.17.0

#Add Packages
RUN apk add --no-cache bash sed grep coreutils python3 make g++ \
	'curl>=8.20.0-r0' \
	'sqlite>=3.53.2-r0' \
	'openssl>=3.5.6-r0'

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
ADD ./libs ./libs
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]