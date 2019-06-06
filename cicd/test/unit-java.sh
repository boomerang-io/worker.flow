#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Static Code Analysis '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_TOOL=$1
VERSION_NAME=$2
SONAR_URL=$1
SONAR_USER=$2
SONAR_APIKEY=$3

if [ "$BUILD_TOOL" == "maven" ]; then
    mvn clean test sonar:sonar -Dversion.name=$VERSION_NAME -Dsonar.login=$SONAR_APIKEY -Dsonar.host.url=$SONAR_URL -Dsonar.projectKey=${p:component.id} -Dsonar.projectName="${p:component.name}" -Dsonar.projectVersion=$VERSION_NAME -Dsonar.verbose=true -Dsonar.scm.disabled=true -Dsonar.junit.reportPaths=target/surefire-reports $MAVEN_OPTS -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml --debug
elif [ "$BUILD_TOOL" == "gradle" ]; then
    echo "ERROR: Gradle not implemented yet."
    exit 1
else
    echo "ERROR: no build tool specified."
    exit 1
if