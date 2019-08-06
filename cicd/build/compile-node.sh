#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Build Artifact '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_TOOL=$1

DEBUG_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    DEBUG_OPTS+="--verbose"
fi

# TODO: wrap --verbose in debug flag.
if [ "$BUILD_TOOL" == "npm" ] || [ "$BUILD_TOOL" == "yarn" ]; then
    if [ -e 'yarn.lock' ]; then
        echo "Running YARN install..."
        yarn install $DEBUG_OPTS
    elif [ -e 'package-lock.json' ]; then
        echo "Running NPM ci..."
        npm ci $DEBUG_OPTS
    else
        echo "Running NPM install..."
        npm install $DEBUG_OPTS
    fi
else
    exit 99
fi

SCRIPT=$(node -pe "require('./package.json').scripts.build");
if [ "$SCRIPT" != "undefined" ]; then
    if [ "$BUILD_TOOL" == "npm" ]; then
        npm run build $DEBUG_OPTS
    elif [ "$BUILD_TOOL" == "yarn" ]; then
        yarn run build $DEBUG_OPTS
    else
        exit 97
    fi
else
    # exit 97
    echo "Build script not defined in package.json. Skipping."
fi