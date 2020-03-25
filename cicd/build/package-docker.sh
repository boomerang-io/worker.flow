#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Package Docker Image '; printf '%.0s-' {1..30}; printf '\n\n' )

IMAGE_NAME=$1
VERSION_NAME=$2
TEAM_NAME=$3
IMAGE_ORG=`echo $TEAM_NAME | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
# Registry Host will potentially required a NO_PROXY entry in the controller service
GLOBAL_REGISTRY_HOST=$4
GLOBAL_REGISTRY_PORT=$5
GLOBAL_REGISTRY_USER=$6
GLOBAL_REGISTRY_PASSWORD=$7
ART_URL=$8
ART_USER=$9
ART_PASSWORD=${10}
CUSTOM_REGISTRY_USER=${11}
CUSTOM_REGISTRY_PASSWORD=${12}
CUSTOM_REGISTRY_HOST=${13}
CUSTOM_REGISTRY_PORT=${14}
DOCKER_FILE=${15}

IMG_OPTS=
SKOPEO_OPTS=
# Note: currently disabled as it actually slows the build down copying out to the mounted PVC.
# if [ -d "/cache" ]; then
#     echo "Setting cache..."
#     mkdir -p /cache/img
#     # Note: Need to set permissons as if the cache has previously been saved then a different user will own
#     chmod -R 755 /cache/img 
#     IMG_OPTS+="-s /cache/img"
#     ls -ltr /cache
# fi
if [ "$DEBUG" == "true" ]; then
    echo "Enabling debug logging..."
    IMG_OPTS+="-d"
    SKOPEO_OPTS+="--debug "
fi

# Login first in case someone is using a docker base image from our registry
/opt/bin/img login $IMG_OPTS -u=$GLOBAL_REGISTRY_USER -p=$GLOBAL_REGISTRY_PASSWORD "$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT"
# Login to a custom repository if needed
if [ "$CUSTOM_REGISTRY_USER" == "undefined" ]; then
    echo "Logging into Custom Registry..."
    /opt/bin/img login $IMG_OPTS -u=$CUSTOM_REGISTRY_USER -p=$CUSTOM_REGISTRY_PASSWORD "$CUSTOM_REGISTRY_HOST:$CUSTOM_REGISTRY_PORT"
fi

# Check for custom Dockerfile path
DOCKERFILE_OPTS=
if [ -z "$DOCKER_FILE" ]; then
    echo "Defaulting Dockerfile..."
    DOCKER_FILE=Dockerfile
else
    DOCKERFILE_OPTS="-f $DOCKER_FILE"
fi
# echo "Dockerfile: $DOCKER_FILE"

IMG_STATE=/data/img
mkdir -p $IMG_STATE
if  [ -f "$DOCKER_FILE" ]; then
    /opt/bin/img build -s "$IMG_STATE" -t $IMAGE_NAME:$VERSION_NAME $IMG_OPTS --build-arg BMRG_TAG=$VERSION_NAME --build-arg https_proxy=$HTTP_PROXY --build-arg http_proxy=$HTTP_PROXY --build-arg HTTP_PROXY=$HTTP_PROXY --build-arg HTTPS_PROXY=$HTTP_PROXY --build-arg NO_PROXY=$NO_PROXY --build-arg no_proxy=$NO_PROXY --build-arg ART_USER=$ART_USER --build-arg ART_PASSWORD=$ART_PASSWORD --build-arg ART_URL=$ART_URL $DOCKERFILE_OPTS .
    RESULT=$?
    if [ $RESULT -ne 0 ] ; then
        exit 90
    fi
else
    exit 96
fi

# /opt/bin/img ls -s "$IMG_STATE" $IMG_OPTS "$IMAGE_NAME:$VERSION_NAME"
/opt/bin/img tag -s "$IMG_STATE" $IMG_OPTS "$IMAGE_NAME:$VERSION_NAME" "$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
# /opt/bin/img ls $IMG_OPTS "$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
#img push currently returns 404 every now and then when working with docker registries
#https://github.com/genuinetools/img/issues/128?_pjax=%23js-repo-pjax-container
#/opt/bin/img push -d ${p:docker.registry.host}:${p:docker.registry.port}/${p:bmrg.org}/${p:bmrg.image.name}:${p:version.name}
/opt/bin/img save -s "$IMG_STATE" $IMG_OPTS -o $IMAGE_NAME_$VERSION_NAME.tar "$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"

if [ "$DEBUG" == "true" ]; then
    echo "Retrieving worker size..."
    df -h
    ls -lhtr $IMAGE_NAME_$VERSION_NAME.tar
    # ping -c 3 $GLOBAL_REGISTRY_HOST
fi

skopeo $SKOPEO_OPTS copy --dest-tls-verify=false docker-archive:$IMAGE_NAME_$VERSION_NAME.tar docker://"$GLOBAL_REGISTRY_HOST:$GLOBAL_REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"

if [ "$DEBUG" == "true" ]; then
    echo "Retrieving worker size..."
    df -h
fi