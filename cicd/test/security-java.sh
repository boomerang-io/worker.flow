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

# Download ASOC CLI
echo "SAClientUtil File: $ART_URL/$ASOC_CLIENT_CLI"
echo "Creds: $ART_REPO_USER:$ART_REPO_PASSWORD"
curl --noproxy "$NO_PROXY" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD "$ART_URL/$ASOC_CLIENT_CLI" -o SAClientUtil.zip

# Unzip ASOC CLI
unzip SAClientUtil.zip
rm -f SAClientUtil.zip
SAC_DIR=`ls -d SAClientUtil*`
echo "SAC_DIR=$SAC_DIR"
mv $SAC_DIR SAClientUtil
mv SAClientUtil ..

# Set ASOC CLI path
export ASOC_PATH=/data/SAClientUtil
export PATH="${ASOC_PATH}:${ASOC_PATH}/bin:${PATH}"

# Set ASOC memory configuration
# echo "-Xmx4g" | tee -a $ASOC_PATH/config/cli.config
# cat $ASOC_PATH/config/cli.config

# Compile source
if [ "$HTTP_PROXY" != "" ]; then
    # Swap , for |
    MAVEN_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
    export MAVEN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$MAVEN_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$MAVEN_PROXY_IGNORE'"
fi
echo "MAVEN_OPTS=$MAVEN_OPTS"
mvn clean package install -DskipTests=true -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true

# Set Java version
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk
export PATH="/usr/lib/jvm/java-11-openjdk/bin:${PATH}"
java --version

# Add ASOC required glibc and zlib packages
export LANG='en_US.UTF-8'
export LANGUAGE='en_US:en'
export LC_ALL='en_US.UTF-8'

apk add --no-cache --virtual .build-deps curl binutils
apk update
apk add zip tar jq gawk xmlstarlet bash curl

export GLIBC_VER="2.30-r0"
export ALPINE_GLIBC_REPO="https://github.com/sgerrand/alpine-pkg-glibc/releases/download"
export GCC_LIBS_URL="https://archive.archlinux.org/packages/g/gcc-libs/gcc-libs-9.1.0-2-x86_64.pkg.tar.xz"
export GCC_LIBS_SHA256="91dba90f3c20d32fcf7f1dbe91523653018aa0b8d2230b00f822f6722804cf08"
export ZLIB_URL="https://archive.archlinux.org/packages/z/zlib/zlib-1%3A1.2.11-3-x86_64.pkg.tar.xz"
export ZLIB_SHA256="17aede0b9f8baa789c5aa3f358fbf8c68a5f1228c5e6cba1a5dd34102ef4d4e5"

curl -LfsS https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub -o /etc/apk/keys/sgerrand.rsa.pub
export SGERRAND_RSA_SHA256="823b54589c93b02497f1ba4dc622eaef9c813e6b0f0ebbb2f771e32adf9f4ef2"
echo "${SGERRAND_RSA_SHA256} */etc/apk/keys/sgerrand.rsa.pub" | sha256sum -c -
curl -LfsS ${ALPINE_GLIBC_REPO}/${GLIBC_VER}/glibc-${GLIBC_VER}.apk > /tmp/glibc-${GLIBC_VER}.apk
apk add --no-cache /tmp/glibc-${GLIBC_VER}.apk
curl -LfsS ${ALPINE_GLIBC_REPO}/${GLIBC_VER}/glibc-bin-${GLIBC_VER}.apk > /tmp/glibc-bin-${GLIBC_VER}.apk
apk add --no-cache /tmp/glibc-bin-${GLIBC_VER}.apk
curl -Ls ${ALPINE_GLIBC_REPO}/${GLIBC_VER}/glibc-i18n-${GLIBC_VER}.apk > /tmp/glibc-i18n-${GLIBC_VER}.apk
apk add --no-cache /tmp/glibc-i18n-${GLIBC_VER}.apk
/usr/glibc-compat/bin/localedef --force --inputfile POSIX --charmap UTF-8 "$LANG" || true
echo "export LANG=$LANG" > /etc/profile.d/locale.sh
curl -LfsS ${GCC_LIBS_URL} -o /tmp/gcc-libs.tar.xz
echo "${GCC_LIBS_SHA256} */tmp/gcc-libs.tar.xz" | sha256sum -c -
mkdir /tmp/gcc
tar -xf /tmp/gcc-libs.tar.xz -C /tmp/gcc
mv /tmp/gcc/usr/lib/libgcc* /tmp/gcc/usr/lib/libstdc++* /usr/glibc-compat/lib
strip /usr/glibc-compat/lib/libgcc_s.so.* /usr/glibc-compat/lib/libstdc++.so*
curl -LfsS ${ZLIB_URL} -o /tmp/libz.tar.xz
echo "${ZLIB_SHA256} */tmp/libz.tar.xz" | sha256sum -c -
mkdir /tmp/libz
tar -xf /tmp/libz.tar.xz -C /tmp/libz
mv /tmp/libz/usr/lib/libz.so* /usr/glibc-compat/lib
apk del --purge .build-deps glibc-i18n
rm -rf /tmp/*.apk /tmp/gcc /tmp/gcc-libs.tar.xz /tmp/libz /tmp/libz.tar.xz /var/cache/apk/*

# Set ASOC bin path
export PATH="${ASOC_PATH}/bin:${PATH}"

# Set ASOC project path
export PROJECT_PATH=`pwd`

# Create ASOC configuration file
cp ${SHELL_DIR}/test/security-java-maven.xml $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/@path" -v "$PROJECT_PATH/target" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@additional_classpath" -v "$PROJECT_PATH/target/dependency;$PROJECT_PATH/target/classes" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@src_root"  -v "$PROJECT_PATH/src/main/java" $ASOC_PATH/appscan-config.xml
xmlstarlet ed --inplace -u "Configuration/Targets/Target/CustomBuildInfo/@jdk_path" -v "$JAVA_HOME" $ASOC_PATH/appscan-config.xml

# Generate ASOC IRX file
export APPSCAN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT"
echo "APPSCAN_OPTS=$APPSCAN_OPTS"
$ASOC_PATH/bin/appscan.sh prepare -v -X -c $ASOC_PATH/appscan-config.xml -n ${COMPONENT_NAME}_${VERSION_NAME}.irx

# If IRX file not created exit with error
if [ ! -f "${COMPONENT_NAME}_${VERSION_NAME}.irx" ]; then
  exit 128
fi

# Start ASOC Static Analyzer scan
echo "ASOC App ID: $ASOC_APP_ID"
echo "ASOC Login Key ID: $ASOC_LOGIN_KEY_ID"
echo "ASOC Login Secret ID: $ASOC_LOGIN_SECRET"

$ASOC_PATH/bin/appscan.sh api_login -u $ASOC_LOGIN_KEY_ID -P $ASOC_LOGIN_SECRET
ASOC_SCAN_ID=$($ASOC_PATH/bin/appscan.sh queue_analysis -a $ASOC_APP_ID -f ${COMPONENT_NAME}_${VERSION_NAME}.irx -n ${COMPONENT_NAME}_${VERSION_NAME} | tail -n 1)
echo "ASOC Scan ID: $ASOC_SCAN_ID"

# If no ASOC Scan ID returned exit with error
if [ -z "$ASOC_SCAN_ID" ]; then
  exit 129
fi

# Wait for ASOC scan to complete
START_SCAN=`date +%s`
RUN_SCAN=true
while [ "$($ASOC_PATH/bin/appscan.sh status -i $ASOC_SCAN_ID)" != "Ready" ] && [ "$RUN_SCAN" == "true" ]; do
  NOW=`date +%s`
  DIFF=`expr $NOW - $START_SCAN`
  if [ $DIFF -gt 600 ]; then
    echo "Timed out waiting for ASOC job to complete [$DIFF/600]"
    RUN_SCAN=false
  else
    echo "ASOC job execution not completed ... waiting 15 seconds they retrying [$DIFF/600]"
    sleep 15
  fi
done

# If scan not completed exit with error
if [ "$RUN_SCAN" == "false" ]; then
  exit 130
fi

# Retrieve ASOC execution summary
$ASOC_PATH/bin/appscan.sh info -i $ASOC_SCAN_ID -json >> ASOC_SUMMARY_${COMPONENT_NAME}_${VERSION_NAME}.json
curl -T ASOC_SUMMARY_${COMPONENT_NAME}_${VERSION_NAME}.json "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/ASOC_SUMMARY_${COMPONENT_NAME}_${VERSION_NAME}.json" --insecure -u admin:WwwWulaWwHH!

# Retrieve ASOC report
$ASOC_PATH/bin/appscan.sh get_result -d ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.zip -i $ASOC_SCAN_ID -t ZIP
curl -T ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.zip "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.zip" --insecure -u admin:WwwWulaWwHH!
