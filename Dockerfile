#Import the base docker image built on top of Alpine
FROM alpine:3.8 

#Add Packages
RUN apk add --no-cache bash sed grep coreutils nodejs yarn

WORKDIR /cli
ADD ./cli.js .
ADD ./log.js .
ADD ./props.js .
ADD ./commands ./commands
ADD ./package.json .
RUN yarn install && yarn link

ENTRYPOINT [ "node", "cli.js" ]