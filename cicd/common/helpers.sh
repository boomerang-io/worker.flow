#!/bin/bash

# This file is not used directly as of yet
# The purpose is to build up a list of repeatable common functions
# These common helpers can then be imported via touch

#############
# Constants #
#############



#############
# Functions #
#############

# Symbolic link creation function
# $1 = link to be created i.e. /usr/bin/helm
# $2 = item to link i.e. /tmp/helm
function ch_link() {
    echo "Creating symbolic link for $1 in /usr/bin"
    if [ -f $1 ]; then
    echo "Link already exists"
    else
    ln -s $2 $1
    echo "Link created"
    fi
}

function ch_helm_tls_string() {
    HELM_RESOURCE_PATH=
    HELM_TLS_STRING=
    if [[ $DEPLOY_HELM_SSL == "true" ]]; then
        echo "   ⋯ Configuring Helm TLS..."
        if [[ "$DEPLOY_KUBE_VERSION" =~ 1.[0-9]+.[0-9]+ ]]; then
            HELM_TLS_STRING='--tls'
        else
            HELM_RESOURCE_PATH="/tmp/.helm"
            mkdir -p $HELM_RESOURCE_PATH
            HELM_TLS_STRING="--tls --tls-ca-cert $HELM_RESOURCE_PATH/ca.crt --tls-cert $HELM_RESOURCE_PATH/admin.crt --tls-key $HELM_RESOURCE_PATH/admin.key"
        fi
        echo "   ↣ Helm TLS parameters configured as: $HELM_TLS_STRING"
    else
        echo "   ↣ Helm TLS disabled, skipping configuration..."
    fi
}

########
# Main #
########

# No main methods in common helpers