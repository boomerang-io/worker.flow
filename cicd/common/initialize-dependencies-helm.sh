#!/bin/bash

# Supported versions are
#   ICP 2.x
#   ICP 3.1 - different versions of kube and helm
#   ICP 3.2 - different versions of kube, helm, and cert locations

KUBE_VERSION=$2

# Forked from reference: https://github.ibm.com/ICP-DevOps/build-harness/blob/master/modules/helm/Makefile
BUILD_HARNESS_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
BUILD_HARNESS_ARCH=$(uname -m | sed 's/x86_64/amd64/g')

# NOTE:
#  THe following variables are shared with helm.sh for deploy step
HELM_RESOURCE_PATH=/tmp/.helm
# END

# NOTE
# The following script is shared with helm.sh
HELM_VERSION=v2.7.2
HELM_CHART_VERSION_COL=2
if [[ "$KUBE_VERSION" =~ 2.[0-9].[0-9] ]]; then
    HELM_VERSION=v2.7.2
elif [[ "$KUBE_VERSION" =~ 3.[0-1].[0-9] ]]; then
    HELM_VERSION=v2.9.1
else
    HELM_VERSION=v2.12.1
    HELM_CHART_VERSION_COL=3 #the column output of helm list changed
fi
# END
HELM_PLATFORM=$BUILD_HARNESS_OS
HELM_ARCH=$BUILD_HARNESS_ARCH
HELM_URL=https://kubernetes-helm.storage.googleapis.com/helm-$HELM_VERSION-$HELM_PLATFORM-$HELM_ARCH.tar.gz
HELM_HOME=/opt/bin/helm

echo "Installing Helm $HELM_VERSION ($HELM_PLATFORM-$HELM_ARCH) from $HELM_URL"
curl '-#' -fL -o /tmp/helm.tar.gz --retry 5 $HELM_URL
tar xzf /tmp/helm.tar.gz -C /tmp
mv /tmp/$HELM_PLATFORM-$HELM_ARCH/helm $HELM_HOME
rm -f /tmp/helm.tar.gz
rm -rf /tmp/$HELM_PLATFORM-$HELM_ARCH

echo "Symbolic link for Helm"
if [ -f /usr/bin/helm ]; then
echo "Link already exists"
else
echo "Creating symbolic link for Helm in /usr/bin"
ln -s $HELM_HOME /usr/bin/helm
fi

echo "Testing Helm client..."
helm version --client

echo "Initializing Helm"
helm init --client-only --skip-refresh --home $HELM_RESOURCE_PATH