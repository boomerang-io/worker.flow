#!/bin/bash

if  [ -f "./scripts/initialize-properties.sh" ]; then
    declare -A properties
    ./scripts/initialize-properties.sh properties
else
    exit 1
fi

( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

apk add curl curl-dev wget openjdk8

BUILD_TOOL=${properties['build.tool']}
BUILD_TOOL_VERSION=${properties['build.tool.version']}
if [ "$BUILD_TOOL" == "maven" ]; then
    echo "Installing maven ..."
    apk add maven
elif [ "$BUILD_TOOL" == "gradle" ]; then
    echo "Installing gradle ..."
    wget https://services.gradle.org/distributions/gradle-$BUILD_TOOL_VERSION-bin.zip
    mkdir -p /opt/gradle
    unzip -d /opt/gradle gradle-$BUILD_TOOL_VERSION-bin.zip
    export PATH=$PATH:/opt/gradle/gradle-$BUILD_TOOL_VERSION/bin
    gradle -v
else
    echo "ERROR: no build tool specified."
    exit 1
fi

( printf '\n'; printf '%.0s-' {1..30}; printf ' Retrieve Source Code '; printf '%.0s-' {1..30}; printf '\n\n' )

WORKSPACE_FOLDER=/data/workspace
GIT_SSH_URL="${properties['component/repoSshUrl']}"
GIT_REPO_URL="${properties['component/repoUrl']}"
GIT_REPO_HOST=`echo "$GIT_REPO_URL" | cut -d '/' -f 3`
GIT_CLONE_URL=$GIT_SSH_URL
mkdir -p ~/.ssh

if [[ "$GIT_SSH_URL" =~ ^http.* ]]; then
    echo "Adjusting clone for http/s"
    GIT_CLONE_URL=`echo "$GIT_SSH_URL" | sed 's#^\(.*://\)\(.*\)\(\.git\)\{0,1\}$#\git@\2.git#' | sed 's/\//:/'`
fi

if [ "$HTTP_PROXY" != "" ]; then
    echo "Setting Git SSH Config with Proxy"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile ./scripts/rsa-git
    hostname $GIT_REPO_HOST
    port 22
    proxycommand socat - PROXY:proxy.boomerangplatform.net:%h:%p,proxyport=1080
EOL
else
    echo "Setting Git SSH Config"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile ./scripts/rsa-git
EOL
fi

echo "Repository URL:" $GIT_CLONE_URL
git clone --progress --verbose -n $GIT_CLONE_URL $WORKSPACE_FOLDER

if  [ -d "$WORKSPACE_FOLDER" ]; then
    cd $WORKSPACE_FOLDER
    ls -ltr
    GIT_COMMIT_ID="${properties['git.commit.id']}"
    git checkout --progress --recurse-submodules $GIT_COMMIT_ID
else
    echo "Git workspace does not exist"
    exit 1
fi

( printf '\n'; printf '%.0s-' {1..30}; printf ' Build Artifact '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_TOOL=${properties['build.tool']}
BUILD_TOOL_VERSION=${properties['build.tool.version']}
VERSION_NAME=${properties['version.name']}
if [ "$BUILD_TOOL" == "maven" ]; then
    if [ "$HTTP_PROXY" != "" ]; then
        # Swap , for |
        MAVEN_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
        export MAVEN_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$MAVEN_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$MAVEN_PROXY_IGNORE'"
    fi
    echo "MAVEN_OPTS=$MAVEN_OPTS"
    mvn clean package -Dmaven.test.skip=true -Dversion.name=$VERSION_NAME
elif [ "$BUILD_TOOL" == "gradle" ]; then
    if [ "$HTTP_PROXY" != "" ]; then
        # Swap , for |
        GRADLE_PROXY_IGNORE=`echo "$NO_PROXY" | sed -e 's/ //g' -e 's/\"\,\"/\|/g' -e 's/\,\"/\|/g' -e 's/\"$//' -e 's/\,/\|/g'`
        export GRADLE_OPTS="-Dhttp.proxyHost=$PROXY_HOST -Dhttp.proxyPort=$PROXY_PORT -Dhttp.nonProxyHosts='$GRADLE_PROXY_IGNORE' -Dhttps.proxyHost=$PROXY_HOST -Dhttps.proxyPort=$PROXY_PORT -Dhttps.nonProxyHosts='$GRADLE_PROXY_IGNORE'"
    fi
    echo "GRADLE_OPTS=$GRADLE_OPTS"
    export PATH=$PATH:/opt/gradle/gradle-$BUILD_TOOL_VERSION/bin
    gradle clean assemble -x test
else
    echo "ERROR: no build tool specified."
    exit 1
fi

( printf '\n'; printf '%.0s-' {1..30}; printf ' Build Docker Image '; printf '%.0s-' {1..30}; printf '\n\n' )

IMAGE_NAME=${properties['docker.image.name']}
if  [ -f "Dockerfile" ]; then
    /opt/bin/img build -t $IMAGE_NAME:$VERSION_NAME --build-arg BMRG_TAG=$VERSION_NAME --build-arg https_proxy=$HTTP_PROXY --build-arg http_proxy=$HTTP_PROXY --build-arg HTTP_PROXY=$HTTP_PROXY --build-arg HTTPS_PROXY=$HTTP_PROXY --build-arg NO_PROXY=$NO_PROXY  --build-arg no_proxy=$NO_PROXY .
else
    echo "Have not implemented the creation of a Dockerfile."
    exit 1
fi

IMAGE_ORG=`echo ${properties['team.name']} | sed 's/[^a-zA-Z0-0]//g' | tr '[:upper:]' '[:lower:]'`
# Registry Host will potentially required a NO_PROXY entry in the controller service
REGISTRY_HOST=${properties['global/container.registry.host']}
REGISTRY_PORT=${properties['global/container.registry.port']}
REGISTRY_USER=${properties['global/container.registry.user']}
REGISTRY_PASSWORD=${properties['global/container.registry.password']}

ping -c 3 $REGISTRY_HOST

/opt/bin/img ls "$IMAGE_NAME:$VERSION_NAME"       
/opt/bin/img tag "$IMAGE_NAME:$VERSION_NAME" "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
/opt/bin/img ls "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
/opt/bin/img login -d -u=$REGISTRY_USER -p=$REGISTRY_PASSWORD "$REGISTRY_HOST:$REGISTRY_PORT"   

#img push currently returns 404 every now and then when working with docker registries
#https://github.com/genuinetools/img/issues/128?_pjax=%23js-repo-pjax-container
#/opt/bin/img push -d ${p:docker.registry.host}:${p:docker.registry.port}/${p:bmrg.org}/${p:bmrg.image.name}:${p:version.name}
/opt/bin/img save -d -o $IMAGE_NAME_$VERSION_NAME.tar "$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"
skopeo --debug copy --dest-tls-verify=false docker-archive:$IMAGE_NAME_$VERSION_NAME.tar docker://"$REGISTRY_HOST:$REGISTRY_PORT/$IMAGE_ORG/$IMAGE_NAME:$VERSION_NAME"

printf '\n'
printf '    ____                                                   \n'
printf '   / __ )____  ____  ____ ___  ___  _________ _____  ____ _\n'
printf '  / __  / __ \/ __ \/ __ `__ \/ _ \/ ___/ __ `/ __ \/ __ `/\n'
printf ' / /_/ / /_/ / /_/ / / / / / /  __/ /  / /_/ / / / / /_/ / \n'
printf '/_____/\____/\____/_/ /_/ /_/\___/_/   \__,_/_/ /_/\__, /  \n'
printf '                                                  /____/   \n'
printf '\n'