#!/bin/bash
#
# Purpose: Initial commands to run every time regardless of mode

# Create /data directory in case not created by Controller
mkdir -p /data
cd /data

if [ $DEBUG ]; then
    echo "Retrieving worker size..."
    df -h
fi