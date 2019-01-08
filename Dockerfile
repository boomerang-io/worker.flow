#Import the base docker image built on top of Alpine
FROM alpine:3.8 

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs yarn

WORKDIR /cli
ADD ./cli.js ./log.js ./props.js ./package.json ./
ADD ./commands ./commands
RUN yarn install && yarn link

ENTRYPOINT [ "node", "cli.js" ]