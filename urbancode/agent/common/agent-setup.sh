#!/bin/sh
# (C) Copyright IBM Corporation 2016.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#Install UCD Agent
# Set the following environment variables when running
# ucdInstallImageUrl= The URL of the install image zip file, or null if your build has already placed it in /tmp
# credentials= The userid:password needed to download $ucdInstallImageUrl, or null if none needed.

timestamp=$(date)
echo "Started building ucda container image at $timestamp."

if [ "x$ucdInstallImageUrl" = "x" ]; then
    echo "No UCD install image URL specified. Looking in /tmp for install image."
else
    echo "UCD install image URL specified. Downloading image from " $ucdInstallImageUrl

    apk add --update curl
#    echo running curl --insecure --output /tmp/ibm-ucd-agent.zip "$ucdInstallImageUrl"
#    curl --insecure --output /tmp/ibm-ucd-agent.zip "$ucdInstallImageUrl"
    echo running curl -Lk --retry 10 --retry-delay 10 --retry-max-time 120 -o /tmp/ibm-ucd-agent.tgz -u $ucdCredentials "$ucdInstallImageUrl/cli/version/downloadArtifacts?component=ucd-agent-linux-x86_64&version=7.1&singleFilePath=ibm-ucd-agent-linux-x86_64.tgz"
    curl -Lk --retry 10 --retry-delay 10 --retry-max-time 120 -o /tmp/ibm-ucd-agent.tgz -u $ucdCredentials "$ucdInstallImageUrl/cli/version/downloadArtifacts?component=ucd-agent-linux-x86_64&version=7.1&singleFilePath=ibm-ucd-agent-linux-x86_64.tgz"
    apk del curl
fi

#unzip the ucd files and agent files
if ls /tmp/ibm-ucd*.tgz 1> /dev/null 2>&1; then
#    echo unzip -q /tmp/ibm-ucd*.zip -d /tmp
#    unzip -q /tmp/ibm-ucd*.zip -d /tmp
#    rm /tmp/ibm-ucd*.zip
    echo tar xfz /tmp/ibm-ucd-agent.tgz -C /tmp
    tar xfz /tmp/ibm-ucd-agent.tgz -C /tmp
     rm /tmp/ibm-ucd*.tgz
else
    echo "No install image found. /tmp/ibm-ucd*.tgz"
    exit 1
fi

#set install properties and install the agent
cat /tmp/install.properties >> /tmp/ibm-ucd-agent-install/install.properties
cd /tmp/ibm-ucd-agent-install

timestamp=$(date)
echo "Completed preparing ucda install files at $timestamp."

./install-agent.sh

timestamp=$(date)
echo "Completed ucda install at $timestamp."

#Clean up temporary install files
rm -rf /tmp/ibm-ucd-agent-install

timestamp=$(date)
echo "Finished building ucda container image at $timestamp."
