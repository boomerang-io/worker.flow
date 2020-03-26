#!/bin/bash

#( printf '\n'; printf '%.0s-' {1..30}; printf ' Security Test - Java '; printf '%.0s-' {1..30}; printf '\n\n' )

COMPONENT_NAME=${1}
VERSION_NAME=${2}
ART_URL=${3}
ART_REPO_USER=${4}
ART_REPO_PASSWORD=${5}
ASOC_APP_ID=${6}
ASOC_LOGIN_KEY_ID=${7}
ASOC_LOGIN_SECRET=${8}
ASOC_CLIENT_CLI=${9}
ASOC_JAVA_RUNTIME=${10}
SHELL_DIR=${11}

# Download ASoC CLI
echo "SAClientUtil File: $ART_URL/$ASOC_CLIENT_CLI"
echo "Creds: $ART_REPO_USER:$ART_REPO_PASSWORD"
curl --noproxy "$NO_PROXY" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD "$ART_URL/$ASOC_CLIENT_CLI" -o SAClientUtil.zip

# Unzip ASoC CLI
unzip SAClientUtil.zip
rm -f SAClientUtil.zip
SAC_DIR=`ls -d SAClientUtil*`
echo "SAC_DIR=$SAC_DIR"
mv $SAC_DIR SAClientUtil
mv SAClientUtil ..

export ASOC_PATH=/data/SAClientUtil
export PATH="${ASOC_PATH}:${ASOC_PATH}/bin:${PATH}"

echo "-Xmx4g" | tee -a $ASOC_PATH/config/cli.config
cat $ASOC_PATH/config/cli.config

# Compile Source
if [ "$HTTP_PROXY" != "" ]; then
    # Swap , for |
    MAVEN_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
    export MAVEN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$MAVEN_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$MAVEN_PROXY_IGNORE'"
fi
echo "MAVEN_OPTS=$MAVEN_OPTS"
mvn clean package install -DskipTests=true -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true

# =======================================================================================

# export JAVA_VERSION=jdk11u
# cp $SHELL_DIR/test/slim-java.sh /usr/local/bin
# set -eux;
#
# apk add --no-cache --virtual .fetch-deps curl;
# export ARCH="$(apk --print-arch)";
# export ESUM='0cb41326f64783c10c3ff7d368c1a38ce83e43a6d3c8423a434be3afe3908316';
# export BINARY_URL='https://github.com/AdoptOpenJDK/openjdk11-binaries/releases/download/jdk11u-2019-01-11-01-22/OpenJDK11U-jdk_x64_linux_openj9_2019-01-11-01-22.tar.gz';
#
# curl -LfsSo /tmp/openjdk.tar.gz ${BINARY_URL};
# ls /tmp;
# mkdir -p /opt/java/openjdk;
# cd /opt/java/openjdk;
# tar -vxf /tmp/openjdk.tar.gz --strip-components=1;
# export PATH="/opt/java/openjdk/bin:$PATH";
# apk add --no-cache --virtual .build-deps bash binutils;
# /usr/local/bin/slim-java.sh /opt/java/openjdk;
# apk del --purge .build-deps;
# rm -rf /var/cache/apk/*;
# apk del --purge .fetch-deps;
# rm -rf /var/cache/apk/*;
# rm -rf /tmp/openjdk.tar.gz;
#
# export JAVA_HOME=/opt/java/openjdk
# export PATH="/opt/java/openjdk/bin:$PATH"
#
# java --version

# =======================================================================================

export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH="/usr/lib/jvm/java-11-openjdk/bin:${PATH}"

java --version

export LD_LIBRARY_PATH=/usr/glibc-compat/lib:/usr/local/lib:/opt/libs/lib:/usr/lib:/lib:$ASOC_PATH/bin
export DYLD_LIBRARY_PATH=/usr/glibc-compat/lib:/usr/local/lib:/opt/libs/lib:/usr/lib:/lib:$ASOC_PATH/bin
export PATH="${ASOC_PATH}/bin:${PATH}"

echo $PATH

echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"
ldd $ASOC_PATH/bin/StaticAnalyzer
echo "-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-"

export PROJECT_PATH=`pwd`
echo $PROJECT_PATH

cp ${SHELL_DIR}/test/security-java-maven.xml $ASOC_PATH/appscan-config.xml

xmlstarlet ed --inplace -u "Configuration/Targets/Target/@path" -v "$PROJECT_PATH/target" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@additional_classpath" -v "$PROJECT_PATH/target/dependency;$PROJECT_PATH/target/classes" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@src_root"  -v "$PROJECT_PATH/src/main/java" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@jdk_path" -v "$JAVA_HOME" $ASOC_PATH/appscan-config.xml

echo "========================================================================================="
cat $ASOC_PATH/appscan-config.xml
echo "========================================================================================="

echo "========================================================================================="
$ASOC_PATH/bin/StaticAnalyzer
echo "========================================================================================="

# Generate IRX file
export APPSCAN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT"
echo "APPSCAN_OPTS=$APPSCAN_OPTS"
$ASOC_PATH/bin/appscan.sh prepare -v -X -c $ASOC_PATH/appscan-config.xml -n ${COMPONENT_NAME}_${VERSION_NAME}.irx

ls -al

curl -T glen.test.java_0.0.41-8.failed "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/glen.test.java_0.0.30-5.failed" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD
curl -T glen.test.java_0.0.41-8_logs.zip "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/glen.test.java_0.0.30-5_logs.zip" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD

# Sleep 5 minutes for debugging
sleep 300

cat $ASOC_PATH/logs/client.log

if [ ! -f "${COMPONENT_NAME}_${VERSION_NAME}.irx" ]; then
  exit 128
fi

# Start Static Analyzer ASoC Scan
echo "ASoC App ID: $ASOC_APP_ID"
echo "ASoC Login Key ID: $ASOC_LOGIN_KEY_ID"
echo "ASoC Login Secret ID: $ASOC_LOGIN_SECRET"

$ASOC_PATH/bin/appscan.sh api_login -u $ASOC_LOGIN_KEY_ID -P $ASOC_LOGIN_SECRET
ASOC_SCAN_ID=$($ASOC_PATH/bin/appscan.sh queue_analysis -a $ASOC_APP_ID -f ${COMPONENT_NAME}_${VERSION_NAME}.irx -n ${COMPONENT_NAME}_${VERSION_NAME} | tail -n 1)
echo "ASoC Scan ID: $ASOC_SCAN_ID"

if [ -z "$ASOC_SCAN_ID" ]; then
  exit 129
fi

START_SCAN=`date +%s`
RUN_SCAN=true
while [ "$($ASOC_PATH/bin/appscan.sh status -i $ASOC_SCAN_ID)" != "Ready" ] && [ "$RUN_SCAN" == "true" ]; do
  NOW=`date +%s`
  DIFF=`expr $NOW - $START_SCAN`
  if [ $DIFF -gt 600 ]; then
    echo "Timed out waiting for ASoC job to complete [$DIFF/600]"
    RUN_SCAN=false
  else
    echo "ASoC job execution not completed ... waiting 15 seconds they retrying [$DIFF/600]"
    sleep 15
  fi
done

if [ "$RUN_SCAN" == "false" ]; then
  exit 130
fi

#Get ASoC execution summary
$ASOC_PATH/bin/appscan.sh info -i $ASOC_SCAN_ID -json >> ASOC_Summary.json

# Download ASoC report
$ASOC_PATH/bin/appscan.sh get_result -d ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.html -i $ASOC_SCAN_ID

cat ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.html

# Upload Scan Results
#ASOC_SCAN_RESULTS_$COMPONENT_NAME_$VERSION_NAME.html
