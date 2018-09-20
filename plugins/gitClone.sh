#!/bin/bash

( printf '%.0s-' {1..30}; printf ' Git Clone '; printf '%.0s-' {1..30}; printf '\n' )

mkdir -p /root/workspace

cd /root/workspace

git clone -b $2 $1 .
        
ls -ltr