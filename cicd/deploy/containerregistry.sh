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

IMG_OPTS=
SKOPEO_OPTS=
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    IMG_OPTS+="-d"
    SKOPEO_OPTS+="--debug "
fi

# Set source connection settings
if [ "$GLOBAL_REGISTRY_PORT" != "undefined" ]; then
    GLOBAL_DOCKER_SERVER="$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT"
else 
    GLOBAL_DOCKER_SERVER="$GLOBAL_REGISTRY_HOST"
fi

# Set source credentials
if [ ! -z "$GLOBAL_REGISTRY_USER" ] || [ ! -z "$GLOBAL_REGISTRY_PASSWORD" ]; then
    echo "Configuring origin container registry credentials..."
    GLOBAL_REGISTRY_CREDS="--src-creds $GLOBAL_REGISTRY_USER:$GLOBAL_REGISTRY_PASSWORD"
else
    echo "Skipping origin container registry credentials..."
    GLOBAL_REGISTRY_CREDS="--src-no-creds=true"
fi
echo "GLOBAL_REGISTRY_CREDS: $GLOBAL_REGISTRY_CREDS"

# Set Destination Connection Settings"
if [ "$DESTINATION_REGISTRY_PORT" != "undefined" ] && [ ! -z "$DESTINATION_REGISTRY_PORT" ] && [[ ! $DESTINATION_REGISTRY_HOST =~ "icr.io" ]]; then
    DESTINATION_DOCKER_SERVER="$DESTINATION_REGISTRY_HOST:$DESTINATION_REGISTRY_PORT"
else
    DESTINATION_DOCKER_SERVER="$DESTINATION_REGISTRY_HOST"
fi

# Set Destination Credentials
if [ ! -z "$DESTINATION_REGISTRY_USER" ] || [ ! -z "$DESTINATION_REGISTRY_PASSWORD" ]; then
    echo "Configuring destination container registry credentials..."
    DESTINATION_REGISTRY_CREDS="--dest-creds $DESTINATION_REGISTRY_USER:$DESTINATION_REGISTRY_PASSWORD"
else
    echo "Skipping destination container registry credentials..."
    DESTINATION_REGISTRY_CREDS="--dest-no-creds=true"
fi
echo "DESTINATION_REGISTRY_CREDS: $DESTINATION_REGISTRY_CREDS"

echo "Copying from Origin to Destination..."
echo "- Origin: $GLOBAL_DOCKER_SERVER/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
echo "- Destination: $DESTINATION_DOCKER_SERVER$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME"
echo ""
skopeo --insecure-policy $SKOPEO_OPTS copy --src-tls-verify=false --dest-tls-verify=false $GLOBAL_REGISTRY_CREDS $DESTINATION_REGISTRY_CREDS docker://$GLOBAL_DOCKER_SERVER/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME docker://$DESTINATION_DOCKER_SERVER$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME
RESULT=$?
if [ $RESULT -ne 0 ] ; then
    exit 88
fi