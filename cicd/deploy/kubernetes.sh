#!/bin/bash

BIN_HOME=/usr/local/bin
KUBE_CLI=$BIN_HOME/kubectl
KUBE_FILES=$1

KUBE_EXITCODE=0
IFS=',' # comma (,) is set as delimiter
read -ra KUBE_FILES_ARRAY <<< "$KUBE_FILES"
echo "Found (${#KUBE_FILES_ARRAY[@]}) files: $KUBE_FILES"
for FILE in "${KUBE_FILES_ARRAY[@]}"; do
    echo "Current Kubernetes File: $FILE"
    $KUBE_CLI apply -f $FILE
    if [ $? -ne 0 ]; then KUBE_EXITCODE=1 && break; fi
done
IFS=' ' # return to default delimiter

if [ $KUBE_EXITCODE -ne 0 ]; then
    echo "Errors have been encountered. Please review the log and or contact a support representative"
    exit 1
fi