# Boomerang Flow Worker

The purpose of this image is to provide a base foundation for Boomerang Flow with the ability to execute the workflow steps

## How to Build

`docker build -t tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:0.0.1 .`

`docker push tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:0.0.1`

## Update Version of CLI

In the cli.js there is a version string for printing out. If you update the tag of the worker, please update this version string.

*TODO:* update how this works.

## How to Test locally

1. Build with the Dockerfile-test
2. Run and pass in required commander parameters

*Note 1:* This requires developers to have kept this dockerfile up to date
*Note 2:* The test Dockerfile will try to immitate the peices that Kubernetes Controller takes care of such as mounting a `/data` directory and `/props/input.properties`

## References

- *Docker*
URL: https://github.com/docker-library/docker/blob/master/Dockerfile.template

This is the base FROM image and itself is based off Alpine.

- *Initial Starter*
URL: https://scotch.io/tutorials/build-an-interactive-command-line-application-with-nodejs

Tutorial on creating a Node CLI
