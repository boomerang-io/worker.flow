#!/bin/bash

HELM_REPO_URL=$1
CHART_NAME=$2
CHART_RELEASE=$3
HELM_IMAGE_TAG=$4
VERSION_NAME=$5

helm --home $HELM_RESOURCE_PATH repo add boomerang-charts $HELM_REPO_URL

CHART_VERSION=`helm list --home $HELM_RESOURCE_PATH $HELM_TLS_STRING --debug --kube-context $KUBE_CLUSTER_HOST-context $CHART_RELEASE | grep $CHART_NAME | rev | cut -d $'\t' -f 2- | sed -e 's/^[[:space:]]*//' | cut -d ' ' -f 1 | rev | sed 's/.*-//'`
echo "Chart Version: $CHART_VERSION"

helm upgrade --home $HELM_RESOURCE_PATH --debug --set $HELM_IMAGE_TAG=$VERSION_NAME --kube-context $KUBE_CLUSTER_HOST-context $HELM_TLS_STRING --reuse-values --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART_NAME