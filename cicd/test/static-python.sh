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
SONAR_FLAGS=
if [ $DEBUG ]; then
    SONAR_FLAGS="-Dsonar.verbose=true"
else
    SONAR_FLAGS=
fi

pylint --generate-rcfile > .pylintrc
pylint --rcfile=.pylintrc $(find . -iname "*.py" -print) -r n --msg-template="{path}:{line}: [{msg_id}({symbol}), {obj}] {msg}" > pylint-report.txt

ls *.py | xargs coverage run
coverage xml

nosetests -sv --with-xunit --xunit-file=nosetests.xml --with-xcoverage --xcoverage-file=coverage.xml

SONAR_FLAGS="$SONAR_FLAGS -Dsonar.python.pylint.reportPath=pylint-report.txt -Dsonar.python.xunit.reportPath=nosetests.xml -Dsonar.python.coverage.reportPath=coverage.xml"
$SONAR_HOME/bin/sonar-scanner -Dsonar.host.url=$SONAR_URL -Dsonar.login=$SONAR_APIKEY -Dsonar.projectKey=$COMPONENT_ID -Dsonar.projectName="$COMPONENT_NAME" -Dsonar.projectVersion=$VERSION_NAME -Dsonar.verbose=true -Dsonar.scm.disabled=true -Dsonar.sources=. -Dsonar.language=py $SONAR_FLAGS
