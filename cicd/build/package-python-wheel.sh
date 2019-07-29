#!/bin/bash

# ( echo "\n"; echo "%.0s-" {1..30}; echo " Build Artifact "; echo "%.0s-" {1..30}; echo "\n\n" )

BUILD_LANGUAGE_VERSION=$1
ART_URL=$2
ART_REPO_ID=$3
ART_REPO_USER=$4
ART_REPO_PASSWORD=$5
ART_REPO_HOME=~/.pypirc

cat >> $ART_REPO_HOME <<EOL
[distutils]
index-servers = local
[local]
repository: $ART_URL/$ART_REPO_ID
username: $ART_REPO_USER
password: $ART_REPO_PASSWORD
EOL

if [ "$BUILD_LANGUAGE_VERSION" == "2" ]; then
	python -m pip install --user --upgrade setuptools wheel
	
	python setup.py sdist bdist_wheel
	python setup.py bdist_wheel upload -r local
	
elif [ "$BUILD_LANGUAGE_VERSION" == "3" ]; then	
	python3 -m pip install --user --upgrade setuptools wheel
	
	python3 setup.py sdist bdist_wheel
	python3 setup.py bdist_wheel upload -r local		
else
	exit 99
fi