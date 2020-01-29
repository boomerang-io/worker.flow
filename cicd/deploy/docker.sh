#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Package Docker Image '; printf '%.0s-' {1..30}; printf '\n\n' )

IMAGE_NAME=$1
VERSION_NAME=$2
TEAM_NAME=$3
IMAGE_ORG=`echo $TEAM_NAME | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
# Registry Host will potentially required a NO_PROXY entry in the controller service
REGISTRY_HOST=$4
REGISTRY_PORT=$5
REGISTRY_USER=$6
REGISTRY_PASSWORD=$7

SKOPEO_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    SKOPEO_OPTS+="--debug "
fi

skopeo $SKOPEO_OPTS copy --dest-tls-verify=false docker-archive:$IMAGE_NAME_$VERSION_NAME.tar docker://"$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
