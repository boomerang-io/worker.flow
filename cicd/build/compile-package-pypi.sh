#!/bin/bash

# ( echo "\n"; echo "%.0s-" {1..30}; echo " Build Artifact "; echo "%.0s-" {1..30}; echo "\n\n" )

BUILD_LANGUAGE_VERSION=$1

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