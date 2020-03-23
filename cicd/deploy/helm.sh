#!/bin/bash

HELM_REPO_URL=$1
CHART_NAME=$2
CHART_RELEASE=$3
HELM_IMAGE_KEY=$4
VERSION_NAME=$5
DEPLOY_KUBE_VERSION=$6
DEPLOY_KUBE_NAMESPACE=$7
DEPLOY_KUBE_HOST=$8
# DEPLOY_HELM_TLS=${9:-true}
DEPLOY_HELM_TLS=$9
if [ "$DEPLOY_HELM_TLS" == "undefined" ]; then
    DEPLOY_HELM_TLS=true
fi
echo "debug - DEPLOY_HELM_TLS_AFTER=$DEPLOY_HELM_TLS"

export KUBE_HOME=~/.kube
export HELM_HOME=~/.helm
BIN_HOME=/usr/local/bin
KUBE_CLI=$BIN_HOME/kubectl

# NOTE
# THe following variables are shared across helm related scripts for deploy step
HELM_VERSION=v2.9.1
HELM_CHART_VERSION_COL=2
if [[ "$DEPLOY_KUBE_VERSION" == "OCP" ]]; then
    HELM_VERSION=v2.12.3
    HELM_CHART_VERSION_COL=3 #the column output of helm list changed
else
    HELM_VERSION=v2.12.1
    HELM_CHART_VERSION_COL=3 #the column output of helm list changed
fi
echo "   ↣ Helm version set at: $HELM_VERSION"
# END

# THe following variables are shared across helm related scripts for deploy step
# ch_helm_tls_string
HELM_RESOURCE_PATH=
HELM_TLS_STRING=
if [[ $DEPLOY_HELM_TLS == "true" ]]; then
    echo "   ⋯ Configuring Helm TLS..."
    if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
        HELM_TLS_STRING='--tls'
    else
        HELM_RESOURCE_PATH=/tmp/.helm
        mkdir -p $HELM_RESOURCE_PATH
        HELM_TLS_STRING='"--tls" "--tls-ca-cert" "'$HELM_RESOURCE_PATH/ca.crt'" "--tls-cert" "'$HELM_RESOURCE_PATH/admin.crt'" "--tls-key" "'$HELM_RESOURCE_PATH/admin.key'"'
        # HELM_TLS_STRING="--tls --tls-ca-cert \"$HELM_RESOURCE_PATH/ca.crt\" --tls-cert \"$HELM_RESOURCE_PATH/admin.crt\" --tls-key \"$HELM_RESOURCE_PATH/admin.key\""
    fi
    echo "   ↣ Helm TLS parameters configured as: $HELM_TLS_STRING"
else
    echo "   ↣ Helm TLS disabled, skipping configuration..."
fi

DEBUG_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    DEBUG_OPTS+='--debug'
else
    # Bug in current version of helm that only checks if DEBUG is present
    # instead of checking for DEBUG=true
    # https://github.com/helm/helm/issues/2401
    unset DEBUG
fi

# Bug fix for custom certs and re initializing helm home
export HELM_HOME=$(helm home)

# helm --home $HELM_RESOURCE_PATH repo add boomerang-charts $HELM_REPO_URL
helm repo add boomerang-charts $HELM_REPO_URL

if [ -z "$CHART_NAME" ] && [ ! -z "$CHART_RELEASE" ]; then
    echo "Auto detecting chart name..."
    if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
        CHART_NAME=`helm list --tls ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
        if [ $? -ne 0 ]; then exit 92; fi
    else
        # CHART_NAME=`helm list --home $HELM_RESOURCE_PATH --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
        CHART_NAME=`helm list --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 2- | rev`
        if [ $? -ne 0 ]; then exit 92; fi
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
        if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            CHART_RELEASE=`helm list --tls | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
            if [ $? -ne 0 ]; then exit 93; fi
        else
            # CHART_RELEASE=`helm list --home $HELM_RESOURCE_PATH --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
            CHART_RELEASE=`helm list --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" | grep $CHART | grep $DEPLOY_KUBE_NAMESPACE | awk '{print $1}'`
            if [ $? -ne 0 ]; then exit 93; fi
        fi 
    elif [ -z "$CHART_RELEASE" ] && [ -z "$DEPLOY_KUBE_NAMESPACE" ]; then
        exit 93
    fi
    if [ ! -z "$CHART_RELEASE" ]; then
        echo "Current Chart Release: $CHART_RELEASE"
        if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            CHART_VERSION=`helm list --tls ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 1 | rev`
            if [ $? -ne 0 ]; then exit 94; fi
        else
            # CHART_VERSION=`helm list --home $HELM_RESOURCE_PATH --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 1 | rev`
            CHART_VERSION=`helm list --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" ^$CHART_RELEASE$ | grep $CHART_RELEASE | rev | awk -v COL=$HELM_CHART_VERSION_COL '{print $COL}' | cut -d '-' -f 1 | rev`
            if [ $? -ne 0 ]; then exit 94; fi
        fi
        echo "Current Chart Version: $CHART_VERSION"
        if [ -z "$CHART_VERSION" ]; then
            exit 94
        fi

        echo "Upgrading helm release..."
        if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            helm upgrade --tls --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
            if [ $? -ne 0 ]; then exit 91; fi
        else
            # helm upgrade --home $HELM_RESOURCE_PATH $DEBUG_OPTS --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
            helm upgrade $DEBUG_OPTS --kube-context $DEPLOY_KUBE_HOST-context --tls --tls-ca-cert "$HELM_RESOURCE_PATH/ca.crt" --tls-cert "$HELM_RESOURCE_PATH/admin.crt" --tls-key "$HELM_RESOURCE_PATH/admin.key" --reuse-values --set $HELM_IMAGE_KEY=$VERSION_NAME --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
            if [ $? -ne 0 ]; then exit 91; fi
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