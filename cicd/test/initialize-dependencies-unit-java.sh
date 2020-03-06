#!/bin/bash

# https://github.com/flapdoodle-oss/de.flapdoodle.embed.mongo/issues/281#issuecomment-485158021

LANG=en_US.UTF-8
LANGUAGE=en_US.UTF-8

apk --no-cache add ca-certificates

wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
wget -q -O glibc-2.29-r0.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk
wget -q -O glibc-bin-2.29-r0.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-bin-2.29-r0.apk
wget -q -O glibc-i18n-2.29-r0.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-i18n-2.29-r0.apk

apk add glibc-2.29-r0.apk glibc-bin-2.29-r0.apk glibc-i18n-2.29-r0.apk

/usr/glibc-compat/bin/localedef -i en_US -f UTF-8 en_US.UTF-8

rm -f *.apk
