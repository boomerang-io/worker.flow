#!/bin/bash

HELM_CHART_DIR=$1
HELM_CHART_IGNORE=$2

# only lint charts which have a `Chart.yaml` and not in ignorelist
chartFolder="$HELM_CHART_DIR"
chartIgnoreList=($HELM_CHART_IGNORE)
chartList=`find . -type f -name 'Chart.yaml'`

for chart in $chartList
do
    #use sed -E instead of -r when testing on Mac
    #chartName=`echo "$chart" | sed 's@\/Chart.yaml@@g' | sed -r "s@\.(\/)?$chartFolder(\/)?@@g"`
    chartName=`echo "$chart" | sed -r "s@\.\/(.*\/)?([^\/]+)\/Chart.yaml@\2@g"`
    printf "  Chart Path: $chart\n"    
    helm lint ./$chartFolder/$chartName/
    RESULT=$?
    if [ $RESULT -ne 0 ] ; then
        exit 89
    fi
done