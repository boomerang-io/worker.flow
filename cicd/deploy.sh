#!/bin/bash

( printf '\n'; printf '%.0s-' {1..30}; printf ' Property Initialization '; printf '%.0s-' {1..30}; printf '\n\n' )

printenv

# declare an associative array
declare -A arr

# read file line by line and populate the array. Field separator is "="
while IFS='=' read -r k v; do
    echo "Key: $k, Value: $v"
    arr["$k"]="$v"
done < '/props/task.input.properties'

( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )



( printf '\n'; printf '%.0s-' {1..30}; printf ' Deploy '; printf '%.0s-' {1..30}; printf '\n\n' )

if [ "$DEPLOY_TYPE" == "kubernetes" ]; then
    echo "Kubernetes Deploy has not yet been implemented. Exiting..."
    exit 1
fi

if [ "$DEPLOY_TYPE" == "helm" ]; then
    helm --home $HELM_RESOURCE_PATH repo add boomerang-charts ${arr['global/helm.repo.url']}

    # Uses variables from above initiate dependencies step

    # TODO: Need to determine how we are handling it set at Stage, Component, or Version level
    CHART=
    if [ -n "${arr['deploy.helm.chart']}" ]  &&  [ "${arr['deploy.helm.chart']}" != "null" ]; then
        CHART=${arr['deploy.helm.chart']}
    elif [ -n "${arr['helm.chart']}" ]  &&  [ "${arr['helm.chart']}" != "null" ]; then
        CHART="${arr['helm.chart']}"
    else
        echo "Helm chart name not provided."
        exit 1
    fi
    echo "Helm Chart: $CHART"

    CHART_RELEASE=${arr['deploy.helm.release']}
    echo "Chart Release: $CHART_RELEASE"

    CHART_VERSION=`helm list --home $HELM_RESOURCE_PATH $HELM_TLS_STRING --debug --kube-context $KUBE_CLUSTER_HOST-context $CHART_RELEASE | grep $CHART | rev | cut -d $'\t' -f 2- | sed -e 's/^[[:space:]]*//' | cut -d ' ' -f 1 | rev | sed 's/.*-//'`
    echo "Chart Version: $CHART_VERSION"

    VERSION_NAME=${arr['version.name']}
    helm upgrade --home $HELM_RESOURCE_PATH --debug --set ${arr['helm.image.tag']}=$VERSION_NAME --namespace $KUBE_NAMESPACE --kube-context $KUBE_CLUSTER_HOST-context --reuse-values $HELM_TLS_STRING --version $CHART_VERSION $CHART_RELEASE boomerang-charts/$CHART
fi

printf '\n'
printf '    ____                                                   \n'
printf '   / __ )____  ____  ____ ___  ___  _________ _____  ____ _\n'
printf '  / __  / __ \/ __ \/ __ `__ \/ _ \/ ___/ __ `/ __ \/ __ `/\n'
printf ' / /_/ / /_/ / /_/ / / / / / /  __/ /  / /_/ / / / / /_/ / \n'
printf '/_____/\____/\____/_/ /_/ /_/\___/_/   \__,_/_/ /_/\__, /  \n'
printf '                                                  /____/   \n'
printf '\n'