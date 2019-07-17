#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

apk add curl curl-dev wget

BUILD_LANGUAGE_VERSION=$1

if [ "$BUILD_LANGUAGE_VERSION" == "11" ]; then
    echo "Language version specified. Installing Java 11..."
    apk --no-cache add openjdk11 --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community
else
    echo "No language version specified. Defaulting to Java 8..."
    apk add openjdk8
fi