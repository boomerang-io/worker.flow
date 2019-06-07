#!/bin/bash

SCRIPTS=/cli/scripts

( printf '\n'; printf '%.0s-' {1..30}; printf ' Property Initialization '; printf '%.0s-' {1..30}; printf '\n\n' )

printenv

# declare an associative array
declare -A arr

# read file line by line and populate the array. Field separator is "="
while IFS='=' read -r k v; do
    echo "Key: $k, Value: $v"
    arr["$k"]="$v"
done < '/props/task.input.properties'

$SCRIPTS/build/initialize-dependencies.sh ${properties['build.tool']} ${properties['build.tool.version']}

$SCRIPTS/common/git-clone.sh ${properties['component/repoSshUrl']} ${properties['component/repoUrl']} ${properties['git.commit.id']}

cd /data/workspace

$SCRIPTS/test/sonarqube.sh 

$SCRIPTS/common/footer.sh