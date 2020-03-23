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

echo "-Xmx4g" | tee -a /data/SAClientUtil/config/cli.config
cat /data/SAClientUtil/config/cli.config

# Compile Source
if [ "$HTTP_PROXY" != "" ]; then
    # Swap , for |
    MAVEN_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
    export MAVEN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$MAVEN_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$MAVEN_PROXY_IGNORE'"
fi
echo "MAVEN_OPTS=$MAVEN_OPTS"
mvn clean package install -DskipTests=true -Dmaven.wagon.http.ssl.insecure=true -Dmaven.wagon.http.ssl.allowall=true -Dmaven.wagon.http.ssl.ignore.validity.dates=true

# # Install jaxb for Java 11
# curl https://repo1.maven.org/maven2/javax/xml/bind/jaxb-api/2.3.0/jaxb-api-2.3.0.jar -o jaxb-api-2.3.0.jar
# curl https://repo1.maven.org/maven2/javax/xml/bind/jaxb-api/2.3.0/jaxb-api-2.3.0.pom -o jaxb-api-2.3.0.pom
# mvn install:install-file -Dfile=jaxb-api-2.3.0.jar -DpomFile=jaxb-api-2.3.0.pom
#
# curl https://repo1.maven.org/maven2/com/sun/xml/bind/jaxb-core/2.3.0/jaxb-core-2.3.0.jar -o jaxb-core-2.3.0.jar
# curl https://repo1.maven.org/maven2/com/sun/xml/bind/jaxb-core/2.3.0/jaxb-core-2.3.0.pom -o jaxb-core-2.3.0.pom
# mvn install:install-file -Dfile=jaxb-core-2.3.0.jar -DpomFile=jaxb-core-2.3.0.pom
#
# curl https://repo1.maven.org/maven2/com/sun/xml/bind/jaxb-impl/2.3.0/jaxb-impl-2.3.0.jar -o jaxb-impl-2.3.0.jar
# curl https://repo1.maven.org/maven2/com/sun/xml/bind/jaxb-impl/2.3.0/jaxb-impl-2.3.0.pom -o jaxb-impl-2.3.0.pom
# mvn install:install-file -Dfile=jaxb-impl-2.3.0.jar -DpomFile=jaxb-impl-2.3.0.pom
#
# mv jaxb*.jar ../SAClientUtil/lib
# rm -Rf jaxb*.pom
#
# export JDK_JAVA_OPTIONS="$JDK_JAVA_OPTIONS --add-modules=java.xml.bind"
# echo "JDK_JAVA_OPTIONS=$JDK_JAVA_OPTIONS"

# Create appscan-config.xml
# cat >> glen-appscan-config.xml <<EOL
# <?xml version="1.0" encoding="UTF-8"?>
# <Configuration>
#    <Targets>
#     <Target path="target/classes">
#       <CustomBuildInfo additional_classpath="target/dependency;target/classes" src_root="src/main/java;src/test/java;src/main/resources" jdk_path="$JAVA_HOME" />
#       <Exclude>SAClientUtil/</Exclude>
#     </Target>
#   </Targets>
# </Configuration>
# EOL

# Install Java for SAClient CLI
# echo "ASOC_JAVA_RUNTIME=$ASOC_JAVA_RUNTIME"
# CURRENT_DIR=`pwd`
# curl --noproxy "$NO_PROXY" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD "$ART_URL/$ASOC_JAVA_RUNTIME" -o java.tar.gz
# mv java.tar.gz ..
# cd ..
# mkdir jvm
# tar -zxvf java.tar.gz -C jvm
# cd jvm
# export JAVA_HOME=$(pwd)/$(ls)
# echo "JAVA_HOME=$JAVA_HOME"
# cd $CURRENT_DIR
# $JAVA_HOME/bin/java -version

# export JAVA_HOME=../SAClientUtil/jre
# $JAVA_HOME/bin/java -version



apk add openjdk8

export JAVA_HOME=/usr/lib/jvm/java-1.8-openjdk
echo "JAVA_HOME=$JAVA_HOME"
$JAVA_HOME/jre/bin/java -version

export JAVACMD="$JAVA_HOME/jre/bin/java"
echo "JAVACMD=$JAVACMD"
$JAVACMD


# rm /data/SAClientUtil/jre/bin/java
# ln -s /usr/lib/jvm/java-1.8-openjdk/jre/bin/java /data/SAClientUtil/jre/bin/java
# ../SAClientUtil/bin/..//jre/bin/java -version

apk add libgcc libstdc++

apk info

wget "https://www.archlinux.org/packages/core/x86_64/zlib/download" -O /tmp/libz.tar.xz \
    && mkdir -p /tmp/libz \
    && tar -xf /tmp/libz.tar.xz -C /tmp/libz \
    && cp /tmp/libz/usr/lib/libz.so.1.2.11 /usr/glibc-compat/lib \
    && /usr/glibc-compat/sbin/ldconfig \
    && rm -rf /tmp/libz /tmp/libz.tar.xz

/usr/glibc-compat/bin/localedef -i en_US -f UTF-8 en_US.UTF-8


apk add sigar


export LD_LIBRARY_PATH=/usr/local/lib:/usr/glibc-compat/lib:/opt/libs/lib:/usr/lib:/lib:/data/SAClientUtil/bin
echo "LD_LIBRARY_PATH=$LD_LIBRARY_PATH"
export DYLD_LIBRARY_PATH=/usr/local/lib:/usr/glibc-compat/lib:/opt/libs/lib:/usr/lib:/lib:/data/SAClientUtil/bin
echo "DYLD_LIBRARY_PATH=$DYLD_LIBRARY_PATH"

export LANG=en_US.UTF-8
export LANG=$LANG > /etc/profile.d/locale.sh
export LANGUAGE=en_US.UTF-8

/usr/glibc-compat/sbin/ldconfig -p

free -m
cat /proc/meminfo

ldd /data/SAClientUtil/bin/StaticAnalyzer

# Generate IRX file
export APPSCAN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT"
echo "APPSCAN_OPTS=$APPSCAN_OPTS"
# ../SAClientUtil/bin/appscan.sh prepare -c appscan-config.xml -n ${COMPONENT_NAME}_${VERSION_NAME}.irx
/data/SAClientUtil/bin/appscan.sh prepare -v -X -n ${COMPONENT_NAME}_${VERSION_NAME}.irx
# mvn package com.hcl.security:appscan-maven-plugin:prepare -Doutput=${COMPONENT_NAME}_${VERSION_NAME}.irx
# $JAVA_HOME/bin/java -Dcom.ibm.jsse2.usefipsprovider=true $APPSCAN_OPTS -cp "../SAClientUtil/lib/*" com.ibm.appscan.cli.common.Launcher "../SAClientUtil" prepare -v -X -n ${COMPONENT_NAME}_${VERSION_NAME}.irx

curl -T glen.test.java_0.0.30-5.failed "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/glen.test.java_0.0.30-5.failed" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD
curl -T glen.test.java_0.0.30-5_logs.zip "https://tools.boomerangplatform.net/artifactory/boomerang/software/asoc/glen.test.java_0.0.30-5_logs.zip" --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD

# Sleep 5 minutes for debugging
sleep 300


# if [ ! -f "${COMPONENT_NAME}_${VERSION_NAME}.irx" ]; then
#   file=`ls *.failed 2> /dev/null`
#   if [ -f "$file" ]; then
#     cp $file ${COMPONENT_NAME}_${VERSION_NAME}.irx
#   fi
# fi

ls -al

# echo "========================================================================================="
# cat appscan-config.xml
# echo "========================================================================================="

cat /data/SAClientUtil/logs/client.log

if [ ! -f "${COMPONENT_NAME}_${VERSION_NAME}.irx" ]; then
  exit 128
fi

# Start Static Analyzer ASoC Scan
echo "ASoC App ID: $ASOC_APP_ID"
echo "ASoC Login Key ID: $ASOC_LOGIN_KEY_ID"
echo "ASoC Login Secret ID: $ASOC_LOGIN_SECRET"

/data/SAClientUtil/bin/appscan.sh api_login -u $ASOC_LOGIN_KEY_ID -P $ASOC_LOGIN_SECRET
ASOC_SCAN_ID=$(/data/SAClientUtil/bin/appscan.sh queue_analysis -a $ASOC_APP_ID -f ${COMPONENT_NAME}_${VERSION_NAME}.irx -n ${COMPONENT_NAME}_${VERSION_NAME} | tail -n 1)
echo "ASoC Scan ID: $ASOC_SCAN_ID"

if [ -z "$ASOC_SCAN_ID" ]; then
  exit 129
fi

START_SCAN=`date +%s`
RUN_SCAN=true
while [ "$(/data/SAClientUtil/bin/appscan.sh status -i $ASOC_SCAN_ID)" != "Ready" ] && [ "$RUN_SCAN" == "true" ]; do
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
/data/SAClientUtil/bin/appscan.sh info -i $ASOC_SCAN_ID -json >> ASOC_Summary.json

# Download ASoC report
/data/SAClientUtil/bin/appscan.sh get_result -d ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.html -i $ASOC_SCAN_ID

cat ASOC_SCAN_RESULTS_${COMPONENT_NAME}_${VERSION_NAME}.html

# Upload Scan Results
#ASOC_SCAN_RESULTS_$COMPONENT_NAME_$VERSION_NAME.html
