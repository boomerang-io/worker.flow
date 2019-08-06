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
K8S_CLUSTER_NAME=$DEPLOY_KUBE_HOST
HELM_RESOURCE_PATH="/tmp/.helm"
HELM_CLUSTER_CONFIG_PATH=$HELM_RESOURCE_PATH/$K8S_CLUSTER_NAME
HELM_TLS_STRING='--tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key"'
# END

DEBUG_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    DEBUG_OPTS+="--debug"
else
    # Bug in current version of helm that only checks if DEBUG is present
    # instead of checking for DEBUG=true
    # https://github.com/helm/helm/issues/2401
    unset DEBUG
fi

helm --home $HELM_RESOURCE_PATH repo add boomerang-charts $HELM_REPO_URL

if [ -z "$CHART_NAME" ] && [ ! -z "$CHART_RELEASE" ]; then
    echo "Auto detecting chart name..."
    CHART_NAME=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk '{print $2}' | cut -d '-' -f 2- | rev`
elif [ -z "$CHART_NAME" ] && [ -z "$CHART_RELEASE" ]; then
    exit 92
fi
echo "Chart Name(s): $CHART_NAME"
echo "Chart Image Tag: $HELM_IMAGE_KEY"
echo "Chart Image Version: $VERSION_NAME"

IFS=',' # comma (,) is set as delimiter
read -ra HELM_CHARTS_ARRAY <<< "$CHART_NAME"
for CHART in "${HELM_CHARTS_ARRAY[@]}"; do
    echo "Current Chart Name: $CHART"
    if [[ -z "$CHART_RELEASE" ]] && [ ! -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        echo "Auto detecting chart release..."
        echo "Note: This only works if there is only one release of the chart in the provided namespace."
        CHART_RELEASE=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
    elif [ -z "$CHART_RELEASE" ] && [ -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        exit 93
    fi
    echo "Current Chart Release: $CHART_RELEASE"

    CHART_VERSION=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk '{print $2}' | cut -d '-' -f 1 | rev`
    echo "Current Chart Version: $CHART_VERSION"
    if [ -z "$CHART_VERSION" ]; then
        exit 94
    fi

    helm upgrade --home $HELM_RESOURCE_PATH $DEBUG_OPTS --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
    RESULT=$?
    if [ $RESULT -ne 0 ] ; then
        exit 91
    fi
    CHART_RELEASE=
done
IFS=' ' # return to default delimiter