#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_LANGUAGE_VERSION=$1

if [ "$BUILD_LANGUAGE_VERSION" == "2" ]; then
    echo "Installing Python 2 ..."
    apk add python
    apk add python-dev
    apk add py-pip
elif [ "$BUILD_LANGUAGE_VERSION" == "3" ]; then
    echo "Installing Python 3 ..."
    apk add python3
    apk add python3-dev
else
	exit 99
fi

apk add gcc
apk add g++
