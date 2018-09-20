#!/bin/bash

( printf '%.0s-' {1..30}; printf ' Build '; printf '%.0s-' {1..30}; printf '\n' )

cd /root/workspace

mvn clean package -Dmaven.test.skip=true -Dversion.name=3.2.1-58