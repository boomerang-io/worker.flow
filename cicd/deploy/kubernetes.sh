#!/bin/bash

KUBE_HOME=/opt/bin
KUBE_CLI=$KUBE_HOME/kubectl
KUBE_FILE=$1
DEPLOY_KUBE_NAMESPACE=$2

echo "Configuring Kubernetes..."
KUBE_HOME=/opt/bin
KUBE_CLI=$KUBE_HOME/kubectl
KUBE_CLI_VERSION=v1.10.2

# Relies on proxy settings coming through if there is a proxy
# TODO: Update URL to https://helm.sh/blog/get-helm-sh/
curl -L https://storage.googleapis.com/kubernetes-release/release/$KUBE_CLI_VERSION/bin/linux/amd64/kubectl -o $KUBE_CLI && chmod +x $KUBE_CLI

KUBE_NAMESPACE=$DEPLOY_KUBE_NAMESPACE
export KUBE_CLUSTER_HOST=wdc3.cloud.boomerangplatform.net #needed for deploy step
KUBE_CLUSTER_IP=10.190.20.176
KUBE_CLUSTER_PORT=8001
KUBE_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJibXJnLWNpY2QtdXJiYW5jb2RlLXRva2VuLXJrOGs0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImJtcmctY2ljZC11cmJhbmNvZGUiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJlMDI5NDA5OS0yZjllLTExZTktODk0MS0wNmVlMGJmM2I3YmIiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06Ym1yZy1jaWNkLXVyYmFuY29kZSJ9.fqpYY6vh6EPXz1KD7xH4p8zQgZskx7hUTPAnuoeS5NHfUa8FrOkUbe4cG2hgas4WcdHicE2YtUxGO5n67OQaMrIi-NiDNDyTBGgX4hXUi1nYHgBYLyY_GE9odCP2Wdr-PFOSGprYHVGhmz4_IquR9bKKZs16rLNs-aUT-OJuMHf0b77sgAImiiHrAuAs_cEqM-otYnbJoGeivauKCsvb6gBIPzzimyCMweNqMicO-L2f3ASpGeg_vU2jzuDy3rEDY1FZ_92yuNXOsbM_3FDfkCS1k5tsl0yHqEqN_cwrOGpp8hMQngX-EPU6pEWh5oel4a9G2WwE65f4GCHEq2MaFQ

$KUBE_CLI config set-cluster $KUBE_CLUSTER_HOST --server=https://$KUBE_CLUSTER_IP:$KUBE_CLUSTER_PORT --insecure-skip-tls-verify=true
$KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --cluster=$KUBE_CLUSTER_HOST
$KUBE_CLI config set-credentials $KUBE_CLUSTER_HOST-user --token=$KUBE_TOKEN
$KUBE_CLI config set-context $KUBE_CLUSTER_HOST-context --user=$KUBE_CLUSTER_HOST-user --namespace=$KUBE_NAMESPACE
$KUBE_CLI config use-context $KUBE_CLUSTER_HOST-context
$KUBE_CLI apply -f $1