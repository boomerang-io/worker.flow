#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Python Static Test Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_LANGUAGE_VERSION=$1
ART_REGISTRY_HOST=$2
ART_REPO_ID=$3
ART_REPO_USER=$4
ART_REPO_PASSWORD=$5

# Create Artifactory references for library download
PIP_CONF=~/.pip.conf
cat >> $PIP_CONF <<EOL
[global]
extra-index-url=https://$ART_REPO_USER:$ART_REPO_PASSWORD@$ART_REGISTRY_HOST/artifactory/api/pypi/$ART_REPO_ID/simple
[install]
extra-index-url=https://$ART_REPO_USER:$ART_REPO_PASSWORD@$ART_REGISTRY_HOST/artifactory/api/pypi/$ART_REPO_ID/simple
EOL

# Export pip config home
export PIP_CONFIG_FILE=$PIP_CONF

if [ "$BUILD_LANGUAGE_VERSION" == "2" ]; then
	pip install --upgrade pip
	RESULT=$?
	if [ $RESULT -ne 0 ] ; then
		exit 89
	fi
	if [ -f requirements.txt ]; then
	    echo "Using requirements.txt file found in project to install dependencies"
	    pip install -r requirements.txt
		RESULT=$?
		if [ $RESULT -ne 0 ] ; then
			exit 89
		fi
	fi
  pip install pylint nose coverage nosexcover
elif [ "$BUILD_LANGUAGE_VERSION" == "3" ]; then
  pip3 install --upgrade pip
	RESULT=$?
	if [ $RESULT -ne 0 ] ; then
		exit 89
	fi
	if [ -f requirements.txt ]; then
	    echo "Using requirements.txt file found in project to install dependencies"
	    pip3 install -r requirements.txt
		RESULT=$?
		if [ $RESULT -ne 0 ] ; then
			exit 89
		fi
	fi
  pip3 install pylint nose coverage nosexcover
else
	exit 99
fi
