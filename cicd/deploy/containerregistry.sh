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
# if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    IMG_OPTS+="-d"
    SKOPEO_OPTS+="--debug "
# fi

# Log into the platforms global container registry
if [ "$GLOBAL_REGISTRY_PORT" != "undefined" ]; then
    GLOBAL_DOCKER_SERVER="$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT"
else 
    GLOBAL_DOCKER_SERVER="$GLOBAL_REGISTRY_HOST"
fi
echo "Logging into Boomerang Container Registry ($GLOBAL_DOCKER_SERVER)..."
/opt/bin/img login $IMG_OPTS -u=$GLOBAL_REGISTRY_USER -p=$GLOBAL_REGISTRY_PASSWORD "$GLOBAL_DOCKER_SERVER"

# Login to the destination
echo "DESTINATION_REGISTRY_PORT=$DESTINATION_REGISTRY_PORT"
if [ "$DESTINATION_REGISTRY_PORT" != "undefined" ] && [ ! -z "$DESTINATION_REGISTRY_PORT" ] && [[ ! $DESTINATION_REGISTRY_HOST =~ "icr.io" ]]; then
    DESTINATION_DOCKER_SERVER="$DESTINATION_REGISTRY_HOST:$DESTINATION_REGISTRY_PORT"
else
    DESTINATION_DOCKER_SERVER="$DESTINATION_REGISTRY_HOST"
fi
if [ ! -z "$DESTINATION_REGISTRY_USER" ] || [ ! -z "$DESTINATION_REGISTRY_PASSWORD" ]; then
    echo "Logging into destinations container registry ($DESTINATION_DOCKER_SERVER)..."
    /opt/bin/img login $IMG_OPTS -u=$DESTINATION_REGISTRY_USER -p="$DESTINATION_REGISTRY_PASSWORD" "$DESTINATION_DOCKER_SERVER"
else
    echo "Skipping destination registry login as no username and / or password provided. "
fi

echo "Origin: $GLOBAL_DOCKER_SERVER/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
echo "Destination: $DESTINATION_DOCKER_SERVER$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME"
if [[ $DESTINATION_REGISTRY_HOST =~ "icr.io" ]]; then
    skopeo $SKOPEO_OPTS copy --dest-tls-verify=false  --dest-creds $DESTINATION_REGISTRY_USER:$DESTINATION_REGISTRY_PASSWORD docker://$DESTINATION_DOCKER_SERVER/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME docker://$DESTINATION_DOCKER_SERVER$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME
    RESULT=$?
else
    skopeo $SKOPEO_OPTS copy --dest-tls-verify=false docker://$DESTINATION_DOCKER_SERVER/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME docker://$DESTINATION_DOCKER_SERVER$DESTINATION_REGISTRY_IMAGE_PATH/$IMAGE_NAME:$VERSION_NAME
    RESULT=$?
fi
if [ $RESULT -ne 0 ] ; then
    exit 88
fi