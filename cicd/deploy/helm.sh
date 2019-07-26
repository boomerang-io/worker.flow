#!/bin/bash

HELM_REPO_URL=$1
CHART_NAME=$2
CHART_RELEASE=$3
HELM_IMAGE_KEY=$4
VERSION_NAME=$5
DEPLOY_KUBE_HOST=$6
DEPLOY_KUBE_NAMESPACE=$7

# NOTE:
#  THe following variables are shared with helm.sh for deploy step
KUBE_CLUSTER_HOST=$DEPLOY_KUBE_HOST
K8S_CLUSTER_NAME=wdc3.cloud.boomerangplatform.net
HELM_RESOURCE_PATH=/tmp/.helm 
HELM_CLUSTER_CONFIG_PATH=$HELM_RESOURCE_PATH/$K8S_CLUSTER_NAME
HELM_TLS_STRING="--tls --tls-ca-cert $HELM_CLUSTER_CONFIG_PATH/ca.crt --tls-cert $HELM_CLUSTER_CONFIG_PATH/admin.crt --tls-key $HELM_CLUSTER_CONFIG_PATH/admin.key"
# END

helm --home $HELM_RESOURCE_PATH repo add boomerang-charts $HELM_REPO_URL

if [ -z "$CHART_NAME" ] && [ ! -z "$CHART_RELEASE" ]; then
    echo "Auto detecting chart name..."
    CHART_NAME=`helm list --tls --home $HELM_RESOURCE_PATH $HELM_TLS_STRING --kube-context $KUBE_CLUSTER_HOST-context ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk '{print $2}' | cut -d '-' -f 2- | rev`
elif [ -z "$CHART_NAME" ] && [ -z "$CHART_RELEASE" ]; then
    exit 92
fi
echo "Chart Name(s): $CHART_NAME"

IFS=',' # comma (,) is set as delimiter
read -ra HELM_CHARTS_ARRAY <<< "$CHART_NAME"
for CHART in "${HELM_CHARTS_ARRAY[@]}"; do
    if [ -z "$CHART_RELEASE" ] && [ ! -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        echo "Auto detecting chart release..."
        echo "Note:\n\t- This only works if there is only one release of the chart in the provided namespace."
        CHART_RELEASE=`helm list --tls --home $HELM_RESOURCE_PATH $HELM_TLS_STRING --kube-context $KUBE_CLUSTER_HOST-context | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
    elif [ -z "$CHART_RELEASE" ] && [ -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        exit 93
    fi
    echo "Chart Release: $CHART_RELEASE"

    CHART_VERSION=`helm list --tls --home $HELM_RESOURCE_PATH $HELM_TLS_STRING --kube-context $KUBE_CLUSTER_HOST-context ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk '{print $2}' | cut -d '-' -f 1 | rev`
    echo "Chart Version: $CHART_VERSION"
    if [ -z "$CHART_VERSION" ]; then
        exit 94
    fi

    helm upgrade --home $HELM_RESOURCE_PATH --debug --set $HELM_IMAGE_KEY=$VERSION_NAME --kube-context $KUBE_CLUSTER_HOST-context $HELM_TLS_STRING --reuse-values --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
done
IFS=' '