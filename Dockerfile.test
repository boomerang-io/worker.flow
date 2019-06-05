#Import the base docker image built on top of Alpine
FROM alpine:3.8 

#Add Packages
RUN apk add --no-cache bash sed grep curl coreutils nodejs yarn

COPY ./props /props/
RUN ls -ltr /props
COPY ./data/uploadfile.txt /data/
RUN ls -ltr /data
WORKDIR /cli
ADD ./cli.js ./log.js ./utils.js ./config.js  ./package.json ./
ADD ./commands ./commands
RUN ls -ltr && yarn install && yarn link
RUN curl --version && ls -ltr /cli/commands

ENTRYPOINT [ "node", "cli" ]