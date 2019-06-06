#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Retrieving Source Code '; printf '%.0s-' {1..30}; printf '\n\n' )

WORKSPACE_FOLDER=/data/workspace
GIT_SSH_URL=$1
GIT_REPO_URL=$2
GIT_REPO_HOST=`echo "$GIT_REPO_URL" | cut -d '/' -f 3`
GIT_CLONE_URL=$GIT_SSH_URL
GIT_COMMIT_ID=$3
mkdir -p ~/.ssh

if [[ "$GIT_SSH_URL" =~ ^http.* ]]; then
    echo "Adjusting clone for http/s"
    GIT_CLONE_URL=`echo "$GIT_SSH_URL" | sed 's#^\(.*://\)\(.*\)\(\.git\)\{0,1\}$#\git@\2.git#' | sed 's/\//:/'`
fi

if [ -f "/cli/cicd/config/rsa-git" ]; then
    echo "Adjusting permissions and checking Git SSH key exists."
    chmod 700 /cli/cicd/config/rsa-git
else
    echo "Git SSH Key not found."
    exit 1
fi

if [ "$HTTP_PROXY" != "" ]; then
    echo "Setting Git SSH Config with Proxy"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile /cli/cicd/config/rsa-git
    hostname $GIT_REPO_HOST
    port 22
    proxycommand socat - PROXY:$PROXY_HOST:%h:%p,proxyport=$PROXY_PORT
EOL
else
    echo "Setting Git SSH Config"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile /cli/cicd/config/rsa-git
EOL
fi

echo "Repository URL:" $GIT_CLONE_URL
git clone --progress --verbose -n $GIT_CLONE_URL $WORKSPACE_FOLDER

if  [ -d "$WORKSPACE_FOLDER" ]; then
    cd $WORKSPACE_FOLDER
    ls -ltr
    git checkout --progress --recurse-submodules $GIT_COMMIT_ID
else
    echo "Git workspace does not exist"
    exit 1
fi
