#!/bin/bash

( printf '\n'; printf '%.0s-' {1..30}; printf ' Static Code Analysis '; printf '%.0s-' {1..30}; printf '\n\n' )

SONAR_URL=$1
SONAR_USER=$2
SONAR_APIKEY=$3
SONAR_GATEID=2
COMPONENT_ID=
COMPONENT_NAME=

#Check sonarqube exists
curl -I --insecure $SONAR_URL/about

# TODO: need COMPONENT_ID and COMPONENT_NAME
curl --noproxy $NO_PROXY --insecure -X POST -u $SONAR_APIKEY: "$( echo "$SONAR_URL/api/projects/create?&project=$COMPONENT_ID&name="$COMPONENT_NAME"" | sed 's/ /%20/g' )"
curl --noproxy $NO_PROXY --insecure -X POST -u $SONAR_APIKEY: '${p:sonar.url}/api/qualitygates/select?projectKey=$COMPONENT_ID&gateId=$SONAR_GATEID'

if [ "$BUILD_TOOL" == "maven" ]; then
    FILE="content.txt"
    REGEX="\s+<plugins>\s+"
    FILE_CONTENT=$( cat "${FILE}" )
    if ![[ " $FILE_CONTENT " =~ $REGEX ]]; then
        # TODO: replace a tag with plugins section. see ucd. need utils for this. probably better to do in node.
    fi
elif [ "$BUILD_TOOL" == "gradle" ]; then
    echo "ERROR: Gradle not implemented yet."
    exit 1
else
    echo "ERROR: no build tool specified."
    exit 1
if