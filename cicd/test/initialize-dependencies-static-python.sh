#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Python Static Test Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

BUILD_LANGUAGE_VERSION=$1

if [ "$BUILD_LANGUAGE_VERSION" == "2" ]; then
    pip install pylint nose coverage nosexcover
elif [ "$BUILD_LANGUAGE_VERSION" == "3" ]; then
    pip3 install pylint nose coverage nosexcover
else
	exit 99
fi

pylint --version
