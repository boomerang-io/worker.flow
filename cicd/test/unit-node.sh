#!/bin/bash

#( printf '\n'; printf '%.0s-' {1..30}; printf ' Static Code Analysis '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_TOOL=$1
VERSION_NAME=$2
SONAR_URL=$3
SONAR_APIKEY=$4
SONAR_GATEID=2
COMPONENT_ID=$5
COMPONENT_NAME=$6

curl --noproxy $NO_PROXY -I --insecure $SONAR_URL/about
curl --noproxy $NO_PROXY --insecure -X POST -u $SONAR_APIKEY: "$( echo "$SONAR_URL/api/projects/create?&project=$COMPONENT_ID&name="$COMPONENT_NAME"" | sed 's/ /%20/g' )"
curl --noproxy $NO_PROXY --insecure -X POST -u $SONAR_APIKEY: "$SONAR_URL/api/qualitygates/select?projectKey=$COMPONENT_ID&gateId=$SONAR_GATEID"

# Dependency for sonarscanner
apk add openjdk8

curl --insecure -o /opt/sonarscanner.zip -L https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-3.3.0.1492.zip
unzip -o /opt/sonarscanner.zip -d /opt
SONAR_FOLDER=`ls /opt | grep sonar-scanner`
SONAR_HOME=/opt/$SONAR_FOLDER
if [ "$DEBUG" == "true" ]; then
    SONAR_FLAGS="-Dsonar.verbose=true"
else
    SONAR_FLAGS=
fi

if [ "$BUILD_TOOL" == "npm" ] || [ "$BUILD_TOOL" == "yarn" ]; then
    if [ -e 'yarn.lock' ]; then
        echo "Running YARN install..."
        yarn install --verbose
    elif [ -e 'package-lock.json' ]; then
        echo "Running NPM ci..."
        npm ci --verbose
    else
        echo "Running NPM install..."
        npm install --verbose
    fi
else
    exit 99
fi

SCRIPT=$(node -pe "require('./package.json').scripts.test");
if [ "$SCRIPT" != "undefined" ]; then
    if [ "$BUILD_TOOL" == "npm" ]; then
        npm run test
    elif [ "$BUILD_TOOL" == "yarn" ]; then
        yarn test
    else
        exit 99
    fi
else
    exit 95
fi
$SONAR_HOME/bin/sonar-scanner -Dsonar.host.url=$SONAR_URL -Dsonar.sources=src -Dsonar.login=$SONAR_APIKEY -Dsonar.projectKey=$COMPONENT_ID -Dsonar.projectName="$COMPONENT_NAME" -Dsonar.projectVersion=$VERSION_NAME -Dsonar.scm.disabled=true $SONAR_FLAGS