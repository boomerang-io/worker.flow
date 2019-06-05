#!/bin/bash

( printf '\n'; printf '%.0s-' {1..30}; printf ' Property Initialization '; printf '%.0s-' {1..30}; printf '\n\n' )

printenv

# declare an associative array
declare -A -n arr=$1

# read file line by line and populate the array. Field separator is "="
while IFS='=' read -r k v; do
    echo "Key: $k, Value: $v"
    arr["$k"]="$v"
done < '/props/task.input.properties'

export PROPERTIES=arr