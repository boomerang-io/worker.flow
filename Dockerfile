#Import the base docker image built
FROM ubuntu:22.04

# Set the SHELL to bash with pipefail option
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Prevent dialog during apt install
ENV DEBIAN_FRONTEND noninteractive
ENV DEBCONF_NOWARNINGS="yes"

WORKDIR /opt/bin

#Add Packages
RUN apt-get -y update && apt-get --no-install-recommends -y install bash sed grep curl coreutils python3 make g++ ca-certificates git jq make nodejs npm openssl openssh-client skopeo socat 

# Install img
RUN curl -fSL "https://github.com/genuinetools/img/releases/download/v0.5.10/img-linux-amd64" -o "/opt/bin/img" && chmod a+x "/opt/bin/img"

# Install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash && \
    source ~/.nvm/nvm.sh && \
    nvm use system && \
    nvm run system --version

WORKDIR /cli
ADD ./package.json ./package-lock.json ./
ADD ./commands ./commands
ADD ./libs ./libs
RUN npm install --production

ENTRYPOINT [ "npm", "start" ]
