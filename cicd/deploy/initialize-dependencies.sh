#!/bin/bash

# Supported versions are
#   ICP 2.x
#   ICP 3.1 - different versions of kube and helm
#   ICP 3.2 - different versions of kube, helm, and cert locations

DEPLOY_TYPE=$1
DEPLOY_KUBE_VERSION=$2
DEPLOY_KUBE_NAMESPACE=$3
DEPLOY_KUBE_HOST=$4
DEPLOY_KUBE_IP=$5
DEPLOY_KUBE_TOKEN=$6

if [ "$DEPLOY_TYPE" == "helm" ] || [ "$DEPLOY_TYPE" == "kubernetes" ]; then
    echo "Configuring Kubernetes..."
    KUBE_HOME=/opt/bin
    KUBE_CLI=$KUBE_HOME/kubectl
    KUBE_CLI_VERSION=v1.10.2 #ICP 3.1.1
    if [[ "$DEPLOY_KUBE_VERSION" =~ 3.2.[0-9] ]]; then
        KUBE_CLI_VERSION=v1.13.5
    fi
    echo "Using Kube CLI $KUBE_CLI_VERSION."

    # Relies on proxy settings coming through if there is a proxy
    curl -L https://storage.googleapis.com/kubernetes-release/release/$KUBE_CLI_VERSION/bin/linux/amd64/kubectl -o $KUBE_CLI && chmod +x $KUBE_CLI

    KUBE_NAMESPACE=$DEPLOY_KUBE_NAMESPACE
    KUBE_CLUSTER_HOST=$DEPLOY_KUBE_HOST
    KUBE_CLUSTER_IP=$DEPLOY_KUBE_IP
    KUBE_CLUSTER_PORT=8001
    KUBE_TOKEN=$DEPLOY_KUBE_TOKEN

    $KUBE_CLI config set-cluster $KUBE_CLUSTER_HOST --server=https://$KUBE_CLUSTER_IP:$KUBE_CLUSTER_PORT --insecure-skip-tls-verify=true
    $KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --cluster=$KUBE_CLUSTER_HOST
    $KUBE_CLI config set-credentials $KUBE_CLUSTER_HOST-user --token=$KUBE_TOKEN
    $KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --user=$KUBE_CLUSTER_HOST-user --namespace=$KUBE_NAMESPACE
    $KUBE_CLI config use-context $KUBE_CLUSTER_HOST-context
fi

if [ "$DEPLOY_TYPE" == "helm" ]; then
    # Forked from reference: https://github.ibm.com/ICP-DevOps/build-harness/blob/master/modules/helm/Makefile
    BUILD_HARNESS_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    BUILD_HARNESS_ARCH=$(uname -m | sed 's/x86_64/amd64/g')

    # NOTE:
    #  THe following variables are shared with helm.sh for deploy step
    K8S_CLUSTER_NAME=$DEPLOY_KUBE_HOST
    HELM_RESOURCE_PATH=/tmp/.helm
    HELM_CLUSTER_CONFIG_PATH=$HELM_RESOURCE_PATH/$K8S_CLUSTER_NAME
    HELM_TLS_STRING="--tls --tls-ca-cert $HELM_CLUSTER_CONFIG_PATH/ca.crt --tls-cert $HELM_CLUSTER_CONFIG_PATH/admin.crt --tls-key $HELM_CLUSTER_CONFIG_PATH/admin.key"
    # END

    
    K8S_CLUSTER_MASTER_IP=$DEPLOY_KUBE_IP
    K8S_CLUSTER_VERSION=$DEPLOY_KUBE_VERSION
    K8S_CLUSTER_MAJOR_VERSION=`echo $K8S_CLUSTER_VERSION | cut -d "." -f 1`
    K8S_CLUSTER_SSH_USER=root
    K8S_CLUSTER_SSH_PRIVATE_KEY=/cli/cicd/config/rsa-bmrgicp
    if [ -f "$K8S_CLUSTER_SSH_PRIVATE_KEY" ]; then
        echo "Adjusting permissions and checking SSH key exists."
        chmod 700 $K8S_CLUSTER_SSH_PRIVATE_KEY
    else
        echo "SSH Key not found."
        exit 1
    fi

    # NOTE
    # The following script is shared with helm.sh
    HELM_VERSION=v2.7.2
    HELM_CHART_VERSION_COL=2
    if [[ "$K8S_CLUSTER_MAJOR_VERSION" =~ 2.[0-9].[0-9] ]]; then
        HELM_VERSION=v2.7.2
    elif [[ "$K8S_CLUSTER_MAJOR_VERSION" =~ 3.[0-1].[0-9] ]]; then
        HELM_VERSION=v2.9.1
    else
        HELM_VERSION=v2.12.1
        HELM_CHART_VERSION_COL=3 #the column output of helm list changed
    fi
    # END
    HELM_PLATFORM=$BUILD_HARNESS_OS
    HELM_ARCH=$BUILD_HARNESS_ARCH
    HELM_URL=https://kubernetes-helm.storage.googleapis.com/helm-$HELM_VERSION-$HELM_PLATFORM-$HELM_ARCH.tar.gz
    HELM_HOME=/opt/bin/helm

    HELM_SSH_BASTION=$K8S_CLUSTER_MASTER_IP
    HELM_SSH_USER=$K8S_CLUSTER_SSH_USER
    HELM_SSH_PRIVATE_KEY=$K8S_CLUSTER_SSH_PRIVATE_KEY
    HELM_SSH_TUNNEL=$HELM_SSH_USER@$HELM_SSH_BASTION
    HELM_SSH_SOCK=/tmp/helm-$HELM_SSH_TUNNEL
    HELM_SSH_OPTS="-A -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $HELM_SSH_PRIVATE_KEY -S $HELM_SSH_SOCK"
    if [ "$DEBUG" == "true" ]; then
        echo "Enabling debug logging..."
        HELM_SSH_OPTS+=" -o LogLevel=debug"
    fi
    HELM_SSH_CMD="ssh $HELM_SSH_OPTS $HELM_SSH_TUNNEL"

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

    echo "Testing Helm client..."
    helm version --client

    echo "Setting SSH Config"
    mkdir -p ~/.ssh
    cat >> ~/.ssh/config <<EOL
host $GIT_REPO_HOST
    StrictHostKeyChecking no
    IdentityFile $K8S_CLUSTER_SSH_PRIVATE_KEY
EOL

    echo "Copying K8S certificates to Helm config folder for ICP v$K8S_CLUSTER_VERSION"
    mkdir -p $HELM_CLUSTER_CONFIG_PATH
    if [[ "$DEPLOY_KUBE_VERSION" =~ [2-3].[0-1].[0-9] ]]; then
        #Prior to ICP 3.2
        HELM_CA_CRT_PATH=cfc-keys
    else
        HELM_CA_CRT_PATH=cfc-certs/root-ca
    fi
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/'$HELM_CA_CRT_PATH'/ca.crt'"'"'' > $HELM_CLUSTER_CONFIG_PATH/ca.crt
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/cfc-certs/helm/admin.crt'"'"'' > $HELM_CLUSTER_CONFIG_PATH/admin.crt
    $HELM_SSH_CMD '/bin/bash -c '"'"'sudo cat /opt/ibm-cp-app-mod-'$K8S_CLUSTER_VERSION'/cluster/cfc-certs/helm/admin.key'"'"'' > $HELM_CLUSTER_CONFIG_PATH/admin.key

    if [ "$DEBUG" == "true" ]; then
        echo "Listing Helm config folder"
        ls -al $HELM_CLUSTER_CONFIG_PATH
    fi

    echo "Initializing Helm"
    # TODO: should /root/.helm go somewhere else?
    helm init --client-only --skip-refresh --home $HELM_RESOURCE_PATH
fi