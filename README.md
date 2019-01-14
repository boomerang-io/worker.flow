# Boomerang Flow Worker

The purpose of this image is to provide a base foundation for Boomerang Flow with the ability to execute the workflow steps

## Design

The CLI has a main cli.js which imports all the `*.js` files under `./commands` folder. These are then mapped to the task / plugins command that are sent through as arguments on the flow_task_template mongodb collection. A command and sub command are required for all runs.

### utils.js

Collection of utility functions to help plugin authors retrieve, resolve, and set properties.

### log.js

Collection of logging utilities using chalk to output nice values in the log for the user

## How to Build

`docker build -t tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:0.0.1 .`

`docker push tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:0.0.1`

## Update Version of CLI

In the cli.js there is a version string for printing out. If you update the tag of the worker, please update this version string.

_TODO:_ update how this works.

## Testing

### How to Test locally with Docker

1. Build with the Dockerfile-test by passing in `-f test.Dockerfile` to the docker build command
2. Run and pass in required commander parameters `docker run -i -t tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:0.0.1 -- sendSlackMessage @twlawrie Test Test`

_Note 1:_ This requires developers to have kept this dockerfile up to date
_Note 2:_ The test Dockerfile will try to immitate the peices that Kubernetes Controller takes care of such as mounting a `/data` directory and `/props/*.properties`

### How to Test locally with Node.js

1. Run cli.js and pass in arguments

```
node cli.js slack sendWebhook
```

## Clean up

### Cleaning up jobs in Kubernetes

When running against the non production cluster. You will need to clean up your runs using `kubectl delete job -l "app=bmrg-flow"`

## References

- _Docker_
  URL: https://github.com/docker-library/docker/blob/master/Dockerfile.template

This is the base FROM image and itself is based off Alpine.

- _Initial Starter_
  URL: https://scotch.io/tutorials/build-an-interactive-command-line-application-with-nodejs

Tutorial on creating a Node CLI
