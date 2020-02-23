#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Retrieving Source Code '; printf '%.0s-' {1..30}; printf '\n\n' )

WORKSPACE_FOLDER=/data/workspace
GIT_SSH_KEY=$1
GIT_SSH_URL=$2
GIT_REPO_URL=$3
GIT_REPO_HOST=`echo "$GIT_REPO_URL" | cut -d '/' -f 3`
GIT_CLONE_URL=$GIT_SSH_URL
GIT_COMMIT_ID=$4
GIT_LFS=false
if [ "$5" != "" ]; then
    GIT_LFS=$5
fi 

if [ "$DEBUG" == "true" ]; then
    echo "GIT_SSH_URL=$GIT_SSH_URL"
    echo "GIT_REPO_URL=$GIT_REPO_URL"
    echo "GIT_REPO_HOST=$GIT_REPO_HOST"
    echo "GIT_CLONE_URL=$GIT_CLONE_URL"
    echo "GIT_COMMIT_ID=$GIT_COMMIT_ID"
    echo "GIT_LFS=$GIT_LFS"
fi

mkdir -p ~/.ssh

if [[ "$GIT_SSH_URL" =~ ^http.* ]]; then
    echo "Adjusting clone for http/s"
    GIT_CLONE_URL=`echo "$GIT_SSH_URL" | sed 's#^\(.*://\)\(.*\)\(\.git\)\{0,1\}$#\git@\2.git#' | sed 's/\//:/'`
fi

# if [ -f "/cli/cicd/config/rsa-git" ]; then
#     echo "Adjusting permissions and checking Git SSH key exists."
#     chmod 700 /cli/cicd/config/rsa-git
# else
#     echo "Git SSH Key not found."
#     exit 1
# fi

echo "Creating Git SSH key and adjusting permissions..."
echo "$GIT_SSH_KEY" > ~/.ssh/id_rsa
chmod 700 ~/.ssh/id_rsa

if [ "$HTTP_PROXY" != "" ]; then
    echo "Setting Git SSH Config with Proxy"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile ~/.ssh/id_rsa
    hostname $GIT_REPO_HOST
    port 22
    proxycommand socat - PROXY:$PROXY_HOST:%h:%p,proxyport=$PROXY_PORT
EOL
else
    echo "Setting Git SSH Config"
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile ~/.ssh/id_rsa
EOL
fi

if [ "$GIT_LFS" == "true" ]; then
    echo "Enabling Git LFS"
    apk add git-lfs
fi

GIT_OPTS=
if [ "$DEBUG" == "true" ]; then
    GIT_OPTS+=--verbose
fi

echo "Repository URL:" $GIT_CLONE_URL
if [ "$GIT_CLONE_URL" == "undefined" ]; then
    echo "Repository URL is undefined."
    exit 1
fi
# git clone --depth 1 --progress $GIT_OPTS -n $GIT_CLONE_URL $WORKSPACE_FOLDER
git clone --progress $GIT_OPTS -n $GIT_CLONE_URL $WORKSPACE_FOLDER

if  [ -d "$WORKSPACE_FOLDER" ]; then
    cd $WORKSPACE_FOLDER
    if [ "$DEBUG" == "true" ]; then
        ls -ltr
    fi
    git checkout --progress --recurse-submodules $GIT_COMMIT_ID
else
    echo "Git workspace does not exist"
    exit 1
fi

if [ "$DEBUG" == "true" ]; then
    echo "Retrieving worker size..."
    df -h
fi