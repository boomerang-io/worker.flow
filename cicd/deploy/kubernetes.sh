#!/bin/bash

# TODO: get the kubectl command line as part of the profile
KUBE_HOME=/opt/bin
KUBE_CLI=$KUBE_HOME/kubectl

KUBE_FILE=$1

$KUBE_CLI apply -f $KUBE_FILE