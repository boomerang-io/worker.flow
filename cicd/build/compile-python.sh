#!/bin/bash

# ( echo "\n"; echo "%.0s-" {1..30}; echo " Build Artifact "; echo "%.0s-" {1..30}; echo "\n\n" )

BUILD_LANGUAGE_VERSION=$1
ART_REGISTRY_HOST=$2
ART_REPO_ID=$3
ART_REPO_USER=$4
ART_REPO_PASSWORD=$5
ART_REPO_HOME=~/.pip/pip.conf

# Create pip home directory
ART_REPO_DIR=`echo $ART_REPO_HOME | rev | cut -d '/' -f2- | rev`
mkdir -p $ART_REPO_DIR

# Create Artifactory references for library download
cat >> $ART_REPO_HOME <<EOL
[global]
extra-index-url=https://$ART_REPO_USER:$ART_REPO_PASSWORD@$ART_REGISTRY_HOST/$ART_REPO_ID/simple
[install]
extra-index-url=https://$ART_REPO_USER:$ART_REPO_PASSWORD@$ART_REGISTRY_HOST/$ART_REPO_ID/simple
EOL

# Build
if [ "$BUILD_LANGUAGE_VERSION" == "2" ]; then
	pip install --upgrade pip

	if [-f Dockerfile] && [grep -q "requirements.txt" Dockerfile]; then
		echo "requirements.txt in Dockerfile"
	else:
		if [ -f requirements.txt ]; then
		    echo "Using requirements.txt file found in project to install dependencies"
		    pip install -r requirements.txt
		else
		    echo "No requirements.txt file found in project"
		fi
	fi
elif [ "$BUILD_LANGUAGE_VERSION" == "3" ]; then
	pip3 install --upgrade pip

	if [-f Dockerfile] && [grep -q "requirements.txt" Dockerfile]; then
		echo "requirements.txt in Dockerfile"
	else:
		if [ -f requirements.txt ]; then
		    echo "Using requirements.txt file found in project to install dependencies"
		    pip3 install -r requirements.txt
		else
		    echo "No requirements.txt file found in project"
		fi
	fi
else
	exit 99
fi
