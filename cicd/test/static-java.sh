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

if [ "$BUILD_TOOL" == "maven" ]; then
    MAVEN_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
    export MAVEN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$MAVEN_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$MAVEN_PROXY_IGNORE'"
    mvn clean compile sonar:sonar --debug -DskipTests=true -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true -Dsonar.login=$SONAR_APIKEY -Dsonar.host.url=$SONAR_URL -Dsonar.projectKey=$COMPONENT_ID -Dsonar.projectName="$COMPONENT_NAME" -Dsonar.projectVersion=$VERSION_NAME -Dsonar.verbose=true -Dsonar.scm.disabled=true
elif [ "$BUILD_TOOL" == "gradle" ]; then
    echo "ERROR: Gradle not implemented yet."
    exit 1
else
    echo "ERROR: no build tool specified."
    exit 1
fi