#!/bin/bash

( printf '%.0s-' {1..30}; printf ' Initiate Git Dependencies '; printf '%.0s-' {1..30}; printf '\n' )

mkdir -p /root/.ssh

cp id_rsa /root/.ssh/id_rsa

chmod 600 /root/.ssh/*