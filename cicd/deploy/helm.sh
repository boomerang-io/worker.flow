#!/bin/bash

HELM_REPO_URL=$1
CHART_NAME=$2
CHART_RELEASE=$3
HELM_IMAGE_KEY=$4
VERSION_NAME=$5
DEPLOY_KUBE_VERSION=$6
DEPLOY_KUBE_NAMESPACE=$7
DEPLOY_KUBE_HOST=$8

# NOTE:
#  THe following variables are shared with helm.sh for deploy step
# export HELM_HOME=/tmp/.helm
KUBE_CLUSTER_HOST=$DEPLOY_KUBE_HOST
K8S_CLUSTER_NAME=$DEPLOY_KUBE_HOST
echo "Initializing Helm"
if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]] || [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
    HELM_TLS_STRING='--tls'
    HELM_RESOURCE_PATH=~/.helm
else
    HELM_RESOURCE_PATH=/tmp/.helm
    HELM_TLS_STRING='--tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key"'
fi
echo "Helm resource path is set as: $HELM_RESOURCE_PATH"
echo "Helm TLS set as: $HELM_TLS_STRING"
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

# Attempting bug fix for custom certs
export HELM_HOME=$(helm home)

if [ -z "$CHART_NAME" ] && [ ! -z "$CHART_RELEASE" ]; then
    echo "Auto detecting chart name..."
    if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]] || [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
        CHART_NAME=`helm list --tls ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
    else
        CHART_NAME=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
    fi 
elif [ -z "$CHART_NAME" ] && [ -z "$CHART_RELEASE" ]; then
    exit 92
fi
echo "Chart Name(s): $CHART_NAME"
echo "Chart Image Tag: $HELM_IMAGE_KEY"
echo "Chart Image Version: $VERSION_NAME"

IFS=',' # comma (,) is set as delimiter
read -ra HELM_CHARTS_ARRAY <<< "$CHART_NAME"
HELM_CHARTS_ARRAY_SIZE=${#HELM_CHARTS_ARRAY[@]}
if [[ $HELM_CHARTS_ARRAY_SIZE > 1 ]]; then
    echo "Multiple charts ($HELM_CHARTS_ARRAY_SIZE) found. Enabling WARNINGS for some failures if one or more charts succeed."
    HELM_CHARTS_EXITCODE=
fi
for CHART in "${HELM_CHARTS_ARRAY[@]}"; do
    echo "Current Chart Name: $CHART"
    if [[ -z "$CHART_RELEASE" ]] && [ ! -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        echo "Auto detecting chart release..."
        echo "Note: This only works if there is only one release of the chart in the provided namespace."
        if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]] || [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            CHART_RELEASE=`helm list --tls | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
        else
            # helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key"
            CHART_RELEASE=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
        fi 
    elif [ -z "$CHART_RELEASE" ] && [ -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        exit 93
    fi
    if [ ! -z "$CHART_RELEASE" ]; then
        echo "Current Chart Release: $CHART_RELEASE"

        if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]] || [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            CHART_VERSION=`helm list --tls ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 1 | rev`
        else
            CHART_VERSION=`helm list --home $HELM_RESOURCE_PATH --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 1 | rev`
        fi
        echo "Current Chart Version: $CHART_VERSION"
        if [ -z "$CHART_VERSION" ]; then
            exit 94
        fi

        echo "Upgrading helm release..."
        if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]] || [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            helm upgrade --tls --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
        else
            helm upgrade --home $HELM_RESOURCE_PATH $DEBUG_OPTS --kube-context $KUBE_CLUSTER_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
        fi
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 91
        fi
        HELM_CHARTS_EXITCODE=0
    elif [ $HELM_CHARTS_ARRAY_SIZE > 1 ]; then
        echo "WARNING - No chart release found. Trapping error as there are multiple charts. Will exit with warning if any chart is successful."
    else
        exit 94
    fi
    CHART_RELEASE=
    echo "Exit Code: $HELM_CHARTS_EXITCODE"
done
IFS=' ' # return to default delimiter

if [[ $HELM_CHARTS_EXITCODE -ne 0 ]] ; then
    echo "No charts were successful. Untrapping error."
    exit 94
fi