#Import the base docker image built on top of Alpine
FROM docker 

#Add Packages
RUN apk add --no-cache git openssh-client bash openjdk8

#Install UrbanCode Agent
ADD ./urbancode/agent/common /tmp/

ARG ucdInstallImageUrl

ARG ucdCredentials

#Install UCD to this directory
ARG AGENT_HOME=/opt/ibm-ucd/agent

RUN /bin/sh /tmp/agent-setup.sh

WORKDIR /tmp

CMD ls -ltr && docker info 

ENTRYPOINT ["sh", "startAgent.sh"]
