#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

BUILD_TOOL=$1
ART_URL=$2
ART_USER=$3
ART_PASSWORD=$4

if [ "$BUILD_TOOL" == "npm" ] || [ "$BUILD_TOOL" == "yarn" ]; then
    add --no-cache curl-dev wget bash gcc g++ make libc6-compat libc-dev lcms2-dev libpng-dev automake autoconf libtool yarn  python && apk add --no-cache vips-dev fftw-dev build-base --repository http://dl-3.alpinelinux.org/alpine/edge/testing --repository http://dl-3.alpinelinux.org/alpine/edge/main && apk add --no-cache nodejs nodejs-npm --repository http://dl-3.alpinelinux.org/alpine/edge/main
else
    exit 99
fi

yarn --version
npm --version

curl --insecure -u $ART_USER:$ART_PASSWORD $ART_URL/api/npm/boomeranglib-npm/auth/boomerang -o .npmrc

if [ "$BUILD_TOOL" == "npm" ] || [ "$BUILD_TOOL" == "yarn" ]; then
    if [ -e 'yarn.lock' ]; then
        if [ "${p?:notifications.slack.proxy.host}" ]; then
            echo "Setting Proxy Settings"
            yarn config set proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            yarn config set https-proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            yarn config set no-proxy ${p?:http.proxy.ignore}
            #yarn config list
        fi
        yarn install --verbose
    elif [ -e 'package-lock.json' ]; then
        if [ "${p?:notifications.slack.proxy.host}" ]; then
            echo "Setting Proxy Settings"
            npm config set proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            npm config set https-proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            npm config set no-proxy http://${p?:http.proxy.ignore}
            #npm config list
        fi
        npm ci --verbose
    else
        if [ "${p?:notifications.slack.proxy.host}" ]; then
            echo "Setting Proxy Settings"
            npm config set proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            npm config set https-proxy http://${p?:http.proxy.host}:${p?:http.proxy.port}
            npm config set no-proxy http://${p?:http.proxy.ignore}
            #npm config list
        fi
        npm install --verbose |& tee -a build-execution-${p:environment.name}.log && exit ${PIPESTATUS[0]}
    fi
else
    exit 99
fi
