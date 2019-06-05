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

if  [ -f "Dockerfile" ]; then
    /opt/bin/img build -t $IMAGE_NAME:$VERSION_NAME --build-arg BMRG_TAG=$VERSION_NAME --build-arg https_proxy=$HTTP_PROXY --build-arg http_proxy=$HTTP_PROXY --build-arg HTTP_PROXY=$HTTP_PROXY --build-arg HTTPS_PROXY=$HTTP_PROXY --build-arg NO_PROXY=$NO_PROXY  --build-arg no_proxy=$NO_PROXY .
else
    echo "Have not implemented the creation of a Dockerfile."
    exit 1
fi

#ping -c 3 $REGISTRY_HOST

/opt/bin/img ls "$IMAGE_NAME:$VERSION_NAME"       
/opt/bin/img tag "$IMAGE_NAME:$VERSION_NAME" "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
/opt/bin/img ls "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
/opt/bin/img login -d -u=$REGISTRY_USER -p=$REGISTRY_PASSWORD "$REGISTRY_HOST:$REGISTRY_PORT"   
#img push currently returns 404 every now and then when working with docker registries
#https://github.com/genuinetools/img/issues/128?_pjax=%23js-repo-pjax-container
#/opt/bin/img push -d ${p:docker.registry.host}:${p:docker.registry.port}/${p:bmrg.org}/${p:bmrg.image.name}:${p:version.name}
/opt/bin/img save -d -o $IMAGE_NAME_$VERSION_NAME.tar "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
skopeo --debug copy --dest-tls-verify=false docker-archive:$IMAGE_NAME_$VERSION_NAME.tar docker://"$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"