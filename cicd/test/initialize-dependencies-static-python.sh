#!/bin/bash

# ( printf '\n'; printf '%.0s-' {1..30}; printf ' Initialize Python Static Test Dependencies '; printf '%.0s-' {1..30}; printf '\n\n' )

apk add pylint

pylint --version
