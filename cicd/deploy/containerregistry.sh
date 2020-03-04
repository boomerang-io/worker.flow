#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Package Docker Image '; printf '%.0s-' {1..30}; printf '\n\n' )

IMAGE_NAME=`echo $1 | tr '[:upper:]' '[:lower:]'`
VERSION_NAME=$2
TEAM_NAME=$3
IMAGE_ORG=`echo $TEAM_NAME | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
# Registry Host will potentially required a NO_PROXY entry in the controller service
DESTINATION_REGISTRY_HOST=$4
DESTINATION_REGISTRY_PORT=$5
DESTINATION_REGISTRY_USER=$6
DESTINATION_REGISTRY_PASSWORD=$7
# DESTINATION_REGISTRY_IMAGE_PREFIX=`echo $8 | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
DESTINATION_REGISTRY_IMAGE_PATH=$8
GLOBAL_REGISTRY_HOST=$9
GLOBAL_REGISTRY_PORT=${10}
GLOBAL_REGISTRY_USER=${11}
GLOBAL_REGISTRY_PASSWORD=${12}

# Login first to the platforms container registry
echo "Logging into Boomerang CICD's container registry..."
/opt/bin/img login $IMG_OPTS -u=$GLOBAL_REGISTRY_USER -p=$GLOBAL_REGISTRY_PASSWORD "$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT"

# Login to the destination
if [ ! -z "$DESTINATION_REGISTRY_USER" ] && [ ! -z "$DESTINATION_REGISTRY_PASSWORD" ]; then
    echo "Logging into destinations container registry..."
    /opt/bin/img login $IMG_OPTS -u=$DESTINATION_REGISTRY_USER -p=$DESTINATION_REGISTRY_PASSWORD "$DESTINATION_REGISTRY_HOST:$DESTINATION_REGISTRY_PORT"
else
    echo "Skipping destination registry login as no username and / or password provided. "
fi

SKOPEO_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    SKOPEO_OPTS+="--debug "
fi

echo "Origin: $GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
echo "Destination: $DESTINATION_REGISTRY_HOST:$DESTINATION_REGISTRY_PORT$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME"
skopeo $SKOPEO_OPTS copy --dest-tls-verify=false docker://$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME docker://$DESTINATION_REGISTRY_HOST:$DESTINATION_REGISTRY_PORT$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME
RESULT=$?
if [ $RESULT -ne 0 ] ; then
    exit 88
fi