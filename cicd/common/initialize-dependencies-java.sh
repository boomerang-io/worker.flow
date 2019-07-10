#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

apk add curl curl-dev wget openjdk8

BUILD_TOOL=$1
BUILD_TOOL_VERSION=$2
if [ "$BUILD_TOOL" == "maven" ]; then
    echo "Installing maven ..."
    apk add maven
    # TODO update to use build tool if specified
elif [ "$BUILD_TOOL" == "gradle" ]; then
    echo "Installing gradle ..."
    wget https://services.gradle.org/distributions/gradle-$BUILD_TOOL_VERSION-bin.zip
    mkdir -p /opt/gradle
    unzip -d /opt/gradle gradle-$BUILD_TOOL_VERSION-bin.zip
    export PATH=$PATH:/opt/gradle/gradle-$BUILD_TOOL_VERSION/bin
    gradle -v
else
    exit 99
fi
