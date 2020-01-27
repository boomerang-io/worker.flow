#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Build Artifact '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_TOOL=$1
CYPRESS_INSTALL_BINARY=$2

DEBUG_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    DEBUG_OPTS+="--verbose"
fi

if [ -z "$CYPRESS_INSTALL_BINARY" ]; then
    echo "Defaulting Cypress Install Binary to 0..."
    CYPRESS_INSTALL_BINARY=0
fi

if [ "$BUILD_TOOL" == "npm" ] || [ "$BUILD_TOOL" == "yarn" ]; then
    if [ -e 'yarn.lock' ]; then
        echo "Running YARN install..."
        CYPRESS_INSTALL_BINARY=0 yarn install $DEBUG_OPTS
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    elif [ -e 'package-lock.json' ]; then
        echo "Running NPM ci..."
        CYPRESS_INSTALL_BINARY=0 npm ci $DEBUG_OPTS
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    else
        echo "Running NPM install..."
        CYPRESS_INSTALL_BINARY=0 npm install $DEBUG_OPTS
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    fi
else
    exit 99
fi

SCRIPT=$(node -pe "require('./package.json').scripts.build");
if [ "$SCRIPT" != "undefined" ]; then
    if [ "$BUILD_TOOL" == "npm" ]; then
        npm run build $DEBUG_OPTS
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    elif [ "$BUILD_TOOL" == "yarn" ]; then
        yarn run build $DEBUG_OPTS
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    else
        exit 97
    fi
else
    # exit 97
    echo "Build script not defined in package.json. Skipping."
fi
