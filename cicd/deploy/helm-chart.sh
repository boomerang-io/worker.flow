#!/bin/bash

HELM_REPO_URL=$1
CHART_NAME=$2
CHART_RELEASE=$3
CHART_VERSION=$4
DEPLOY_KUBE_VERSION=$5
DEPLOY_KUBE_NAMESPACE=$6
DEPLOY_KUBE_HOST=$7

# NOTE:
#  THe following variables are shared with helm.sh for deploy step
KUBE_CLUSTER_HOST=$DEPLOY_KUBE_HOST
K8S_CLUSTER_NAME=$DEPLOY_KUBE_HOST
HELM_RESOURCE_PATH="/tmp/.helm"
HELM_CLUSTER_CONFIG_PATH=$HELM_RESOURCE_PATH/$K8S_CLUSTER_NAME
HELM_TLS_STRING='--tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key"'
# END

# NOTE:
#   The following script is shared with initialize-dependencies.sh
HELM_VERSION=v2.7.2
HELM_CHART_VERSION_COL=2
if [[ "$K8S_CLUSTER_MAJOR_VERSION" =~ 2.[0-9].[0-9] ]]; then
    HELM_VERSION=v2.7.2
elif [[ "$K8S_CLUSTER_MAJOR_VERSION" =~ 3.[0-1].[0-9] ]]; then
    HELM_VERSION=v2.9.1
else
    HELM_VERSION=v2.12.1
    HELM_CHART_VERSION_COL=3 #the column output of helm list changed
fi
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
    CHART_NAME=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
elif [ -z "$CHART_NAME" ] && [ -z "$CHART_RELEASE" ]; then
    exit 92
fi
echo "Chart Name: $CHART_NAME"
echo "Chart Version: $CHART_VERSION"

if [[ -z "$CHART_RELEASE" ]] && [ ! -z "$DEPLOY_KUBE_NAMESPACE" ]; then
    echo "Auto detecting chart release..."
    echo "Note: This only works if there is only one release of the chart in the provided namespace."
    CHART_RELEASE=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
elif [ -z "$CHART_RELEASE" ] && [ -z "$DEPLOY_KUBE_NAMESPACE" ]; then
    exit 93
fi
echo "Current Chart Release: $CHART_RELEASE"

helm upgrade --home $HELM_RESOURCE_PATH $DEBUG_OPTS --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_CLUSTER_CONFIG_PATH/ca.crt" --tls-cert "$HELM_CLUSTER_CONFIG_PATH/admin.crt" --tls-key "$HELM_CLUSTER_CONFIG_PATH/admin.key" --reuse-values --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
RESULT=$?
if [ $RESULT -ne 0 ] ; then
    exit 91
fi