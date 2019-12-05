#!/bin/bash

VERSION_NAME=$1
HELM_REPO_URL=$2
HELM_CHART_DIR=$3
HELM_CHART_IGNORE=$4
HELM_CHART_VERSION_INCREMENT=$5
HELM_CHART_VERSION_TAG=$6
GIT_REF=$7

if [ "$DEBUG" == "true" ]; then
    echo "VERSION_NAME=$VERSION_NAME"
    echo "HELM_REPO_URL=$HELM_REPO_URL"
    echo "HELM_CHART_DIR=$HELM_CHART_DIR"
    echo "HELM_CHART_IGNORE=$HELM_CHART_IGNORE"
    echo "HELM_CHART_VERSION_INCREMENT=$HELM_CHART_VERSION_INCREMENT"
    echo "HELM_CHART_VERSION_TAG=$HELM_CHART_VERSION_TAG"
    echo "GIT_REF=$GIT_REF"
fi

# NOTE:
#  THe following variables are shared with helm.sh for deploy step
HELM_RESOURCE_PATH=/tmp/.helm
# END

helm repo add boomerang-charts $HELM_REPO_URL --home $HELM_RESOURCE_PATH
RESULT=$?
if [ $RESULT -ne 0 ] ; then
    exit 89
fi

# only package charts which have a `Chart.yaml` and not in ignorelist
chartFolder=
if [ "$HELM_CHART_DIR" != "undefined" ]; then
    chartFolder=$HELM_CHART_DIR
fi
echo "Chart Folder: $chartFolder"
chartIgnoreList=($HELM_CHART_IGNORE)
chartList=`find . -type f -name 'Chart.yaml'`
chartStableDir=/data/charts/stable
mkdir -p $chartStableDir
if [ "$DEBUG" == "true" ]; then
    echo "Checking /data/charts folder..."
    ls -ltr /data/charts
fi

for chart in $chartList
do
    #use sed -E instead of -r when testing on Mac
    #chartName=`echo "$chart" | sed 's@\/Chart.yaml@@g' | sed -r "s@\.(\/)?$chartFolder(\/)?@@g"`
    chartName=`echo "$chart" | sed -r "s@\.\/(.*\/)?([^\/]+)\/Chart.yaml@\2@g"`
    ( printf '\n'; printf '%.0s-' {1..30}; printf " Packaging Chart: $chartName "; printf '%.0s-' {1..30}; printf '\n' )
    printf "  Chart Path: $chart\n"
    if [[ ! " ${chartIgnoreList[@]} " =~ " $chartName " ]] && [[ "$chart" =~ ^\.(\/)?$chartFolder(\/)?$chartName\/.*$ ]]; then
        chartVersion=`helm inspect chart ./$chartFolder/$chartName | grep version | sed 's@version: @@g'`
        printf "  Existing Chart Version: $chartVersion\n"
        if [[ "$HELM_CHART_VERSION_INCREMENT" == "true" ]]; then
            printf "  Auto Incrementing Chart Version...\n"
            newMajorMinor=`echo $chartVersion | sed -r 's@^([0-9]+\.[0-9]+\.).*@\1@g'`
            newIteration=`echo $chartVersion |  cut -d . -f3 | sed -r 's@^([0-9\.]+)([\-]?.*)$@\1@g'`
            postIteration=`echo $chartVersion |  cut -d . -f3 | sed -r 's@^([0-9\.]+)([\-]?.*)$@\2@g'`
            chartVersion=$newMajorMinor$((newIteration+1))$postIteration
        fi
        if [[ "$HELM_CHART_VERSION_TAG" == "true" ]] && [[ "$GIT_REF" =~ "refs/tags/" ]]; then
            printf "  Seting Chart Version to Tag...\n"
            chartVersion=`echo $GIT_REF | cut -d / -f3`
        fi
        printf "  Chart Version: $chartVersion\n"
        helm dependency update ./$chartFolder/$chartName/ --home $HELM_RESOURCE_PATH
        helm package --version $chartVersion -d $chartStableDir/ ./$chartFolder/$chartName/ --home $HELM_RESOURCE_PATH
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    else
        printf "Skipping chart based on ignore list or directory path...\n"
    fi
done