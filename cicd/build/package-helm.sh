#!/bin/bash

VERSION_NAME=$1
HELM_REPO_URL=$2
HELM_CHART_DIR=$3
HELM_CHART_IGNORE=$4
HELM_CHART_VERSION_INCREMENT=$5
HELM_CHART_VERSION_TAG=$5
GIT_REF=$6

helm repo add boomerang-charts $HELM_REPO_URL
RESULT=$?
if [ $RESULT -ne 0 ] ; then
    exit 89
fi

# only package charts which have a `Chart.yaml` and not in ignorelist
chartFolder="$HELM_CHART_DIR"
chartIgnoreList=($HELM_CHART_IGNORE)
chartList=`find . -type f -name 'Chart.yaml'`
chartStableDir=/data/charts/stable
mkdir -p $chartStableDir
ls -ltr /data/charts

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
            newMajorMinor=`echo $chartVersion | sed -r 's@^([0-9]+\.[0-9]+\.).*@\1@g'`
            newIteration=`echo $chartVersion |  cut -d . -f3 | sed -r 's@^([0-9\.]+)([\-]?.*)$@\1@g'`
            postIteration=`echo $chartVersion |  cut -d . -f3 | sed -r 's@^([0-9\.]+)([\-]?.*)$@\2@g'`
            chartVersion=$newMajorMinor$((newIteration+1))$postIteration
        fi
        if [[ "$HELM_CHART_VERSION_TAG" == "true" ]] && [[ "$GIT_REF" =~ "refs/tags/" ]]; then
            chartVersion=`echo $GIT_REF | cut -d / -f3`
        fi
        printf "  Chart Version: $chartVersion\n"
        helm dependency update ./$chartFolder/$chartName/
        helm package --version $chartVersion -d $chartStableDir/ ./$chartFolder/$chartName/
        RESULT=$?
        if [ $RESULT -ne 0 ] ; then
            exit 89
        fi
    else
        printf "Skipping chart based on ignore list or directory path...\n"
    fi
done