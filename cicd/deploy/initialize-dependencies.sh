#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

DEPLOY_TYPE=$1
DEPLOY_KUBE_VERSION=$2
DEPLOY_KUBE_NAMESPACE=$3

env

if [ "$DEPLOY_TYPE" == "helm" ] || [ "$DEPLOY_TYPE" == "kubernetes" ]; then
    echo "Configuring Kubernetes..."
    KUBE_HOME=/opt/bin
    KUBE_CLI=$KUBE_HOME/kubectl
    KUBE_CLI_VERSION=v1.10.2

    # Relies on proxy settings coming through if there is a proxy
    curl -L https://storage.googleapis.com/kubernetes-release/release/$KUBE_CLI_VERSION/bin/linux/amd64/kubectl -o $KUBE_CLI && chmod +x $KUBE_CLI

    KUBE_NAMESPACE=$DEPLOY_KUBE_NAMESPACE
    export KUBE_CLUSTER_HOST=wdc3.cloud.boomerangplatform.net #needed for deploy step
    KUBE_CLUSTER_IP=10.190.20.176
    KUBE_CLUSTER_PORT=8001
    KUBE_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoicmJqeDN4Y3g3YnkzeGJhYzRyNW0iLCJyZWFsbU5hbWUiOiJjdXN0b21SZWFsbSIsInVuaXF1ZVNlY3VyaXR5TmFtZSI6InR3bGF3cmllQHVzLmlibS5jb20iLCJpc3MiOiJodHRwczovL2Nsb3VkLmJvb21lcmFuZ3BsYXRmb3JtLm5ldDo5NDQzL29pZGMvZW5kcG9pbnQvT1AiLCJhdWQiOiJjNGE2NzIwMjQ4OGQwN2Q0ZjNkZmNmZTc4YjBkNzQyMSIsImV4cCI6MTU1OTI5Mzk2MiwiaWF0IjoxNTU5MjY1MTYyLCJzdWIiOiJ0d2xhd3JpZUB1cy5pYm0uY29tIiwidGVhbVJvbGVNYXBwaW5ncyI6WyJzeXN0ZW06bWFzdGVycyJdfQ.PpgdsLJo9UUk65YCsAGe00mwjnsEf63-nrk-H89gMWYHRJZ00uU_eefNWYDEtV5ZbvkGUhUY0KOxPNHbn7qAJa02cifwkRaJtEiL3cpC24UTA2m3VnAqJ5Gty2ub_wsPfWqHkxavLIWqcb0eZqvDIxsdlrqCRSAJf4INqPshvercK59YU9kWyE4lm49DT6L7HJlq8JXhIHBS5shbPnl-xrLGThaaxE5OxqY_Tz3e4NgC6WZqNseBwrndC9xRZx3ApmfN8rR8xCJ6gGUYK1NpPxiRUBntN3yDlku5SkXkPW4u4acFNJjb76_6AcX_Vr6OzBIGgnAWDmg9RCFcEp1l0g

    $KUBE_CLI config set-cluster $KUBE_CLUSTER_HOST --server=https://$KUBE_CLUSTER_IP:$KUBE_CLUSTER_PORT --insecure-skip-tls-verify=true
    $KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --cluster=$KUBE_CLUSTER_HOST
    $KUBE_CLI config set-credentials $KUBE_CLUSTER_HOST-user --token=$KUBE_TOKEN
    $KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --user=$KUBE_CLUSTER_HOST-user --namespace=$KUBE_NAMESPACE
    $KUBE_CLI config use-context $KUBE_CLUSTER_HOST-context
fi

if [ "$DEPLOY_TYPE" == "helm" ]; then
    # Forked from reference: https://github.ibm.com/ICP-DevOps/build-harness/blob/master/modules/helm/Makefile
    BUILD_HARNESS_PATH=/root
    BUILD_HARNESS_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    BUILD_HARNESS_ARCH=$(uname -m | sed 's/x86_64/amd64/g')

    K8S_CLUSTER_NAME=wdc3.cloud.boomerangplatform.net
    K8S_CLUSTER_MASTER_IP=10.190.20.176
    K8S_CLUSTER_VERSION=$DEPLOY_KUBE_VERSION
    K8S_CLUSTER_MAJOR_VERSION=`echo $K8S_CLUSTER_VERSION | cut -d "." -f 1`
    K8S_CLUSTER_SSH_USER=root
    K8S_CLUSTER_SSH_PRIVATE_KEY=/cli/scripts/config/rsa-bmrgicp

    HELM_VERSION=v2.7.2
    if [ "$K8S_CLUSTER_MAJOR_VERSION" = "2" ]
    then
        HELM_VERSION=v2.7.2
    elif [ "$K8S_CLUSTER_MAJOR_VERSION" = "3" ]
    then
        HELM_VERSION=v2.9.1
    fi
    HELM_PLATFORM=$BUILD_HARNESS_OS
    HELM_ARCH=$BUILD_HARNESS_ARCH
    HELM_URL=https://kubernetes-helm.storage.googleapis.com/helm-$HELM_VERSION-$HELM_PLATFORM-$HELM_ARCH.tar.gz
    HELM_HOME=/opt/bin/helm

    HELM_SSH_BASTION=$K8S_CLUSTER_MASTER_IP
    HELM_SSH_USER=$K8S_CLUSTER_SSH_USER
    HELM_SSH_PRIVATE_KEY=$K8S_CLUSTER_SSH_PRIVATE_KEY
    HELM_SSH_TUNNEL=$HELM_SSH_USER@$HELM_SSH_BASTION
    HELM_SSH_SOCK=/tmp/helm-$HELM_SSH_TUNNEL
    HELM_SSH_OPTS="-A -o LogLevel=error -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $HELM_SSH_PRIVATE_KEY -S $HELM_SSH_SOCK"
    HELM_SSH_CMD="ssh $HELM_SSH_OPTS $HELM_SSH_TUNNEL"

    export HELM_RESOURCE_PATH=/tmp/.helm #needed for deploy step
    HELM_CLUSTER_CONFIG_PATH=$HELM_RESOURCE_PATH/$K8S_CLUSTER_NAME
    export HELM_TLS_STRING="--tls --tls-ca-cert $HELM_CLUSTER_CONFIG_PATH/ca.crt --tls-cert $HELM_CLUSTER_CONFIG_PATH/admin.crt --tls-key $HELM_CLUSTER_CONFIG_PATH/admin.key"  #needed for deploy step

    echo "Installing Helm $HELM_VERSION ($HELM_PLATFORM-$HELM_ARCH) from $HELM_URL"
    curl '-#' -fL -o /tmp/helm.tar.gz --retry 5 $HELM_URL
    tar xzf /tmp/helm.tar.gz -C /tmp
    mv /tmp/$HELM_PLATFORM-$HELM_ARCH/helm $HELM_HOME
    rm -f /tmp/helm.tar.gz
    rm -rf /tmp/$HELM_PLATFORM-$HELM_ARCH

    echo "Symbolic link for Helm"
    if [ -f /usr/bin/helm ]; then
    echo "Link already exists"
    else
    echo "Creating symbolic link for Helm in /usr/bin"
    ln -s $HELM_HOME /usr/bin/helm
    fi

    echo "Testing Helm client at $HELM"
    helm version --client

    echo "Setting SSH Config"
    mkdir -p ~/.ssh
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile ./scripts/rsa-bmrgicp
EOL

    echo "Copying K8S certificates to Helm config folder for ICP v$K8S_CLUSTER_VERSION"
    mkdir -p $HELM_CLUSTER_CONFIG_PATH
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/cfc-keys/ca.crt'"'"'' > $HELM_CLUSTER_CONFIG_PATH/ca.crt
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/cfc-certs/helm/admin.crt'"'"'' > $HELM_CLUSTER_CONFIG_PATH/admin.crt
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/cfc-certs/helm/admin.key'"'"'' > $HELM_CLUSTER_CONFIG_PATH/admin.key

    # only needed in debug mode
    # echo "Listing Helm config folder"
    # ls -al $HELM_CLUSTER_CONFIG_PATH

    echo "Initializing Helm"
    # TODO: should /root/.helm go somewhere else?
    helm init --client-only --skip-refresh --home $HELM_RESOURCE_PATH
fi