# Boomerang Flow Worker

This is the Boomerang Flow Worker that runs the out of the box tasks and map to the task_templates in Flow.

Depends on:

- [Boomerang Worker CLI](https://github.ibm.com/Boomerang-Workers/boomerang.worker.base)
- [Boomerang Worker Core](https://github.ibm.com/Boomerang-Workers/boomerang.worker.base)

## Design

TBA

### Failure

When a method fails, we need to set or return (depending on the type of method) by catching the error to log and then return process.exit(1). This allows the container to fail the Kubernetes Pod which will in turn eventually bubble up the failure to the UI.

## Developing and Testing

When developing commands you can run `npm run-script dev` which will run the CLI with DEBUG enabled. This means that it will look for a `/props` folder locally which allows you to feed in the property model as required.

### How to Test locally with Docker

1. Build with the Dockerfile-test by passing in `-f Dockerfile.test` to the docker build command
2. Run and pass in required commander parameters `docker run -i -t tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:test -- slack sendWebhook`

Example: `docker build -t bmrg-worker-flow:test -v /props:/props . && docker run -i -t bmrg-worker-flow:test -- slack sendWebhook`

_Note 1:_ This requires developers to have kept this dockerfile up to date
_Note 2:_ The test Dockerfile will try to immitate the peices that Kubernetes Controller takes care of such as mounting a `/data` directory and `/props/*.properties`

### How to Test locally with Node.js

1. Ensure that you have the package cross-env installed
2. Run the node:cli script and pass in arguments

```
npm run node:cli slack sendWebhook
```

### Setting input Variables for Testing

Under the `props` folder, you can set input variables:
`task.input.properties` -> set variables that will be the input for a task plugin
`workflow.input.properties` -> these variables will be available across tasks

These files are designed to replicate the properties that would be mounted in confimaps by the controller service.

## Packaging

### Flow

`VERSION=2.0.0 && docker build -t tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:$VERSION . && docker push tools.boomerangplatform.net:8500/ise/bmrg-worker-flow:$VERSION`

### Lifecycle

`VERSION=2.0.0 && docker build -t tools.boomerangplatform.net:8500/ise/bmrg-worker-lifecycle:$VERSION -f Dockerfile.lifecycle . && docker push tools.boomerangplatform.net:8500/ise/bmrg-worker-lifecycle:$VERSION`

## Clean up

### Cleaning up jobs in Kubernetes

When running against the non production cluster. You will need to clean up your runs using `kubectl delete job -l "app=bmrg-flow"`

## References

- [Docker](https://github.com/docker-library/docker/blob/master/Dockerfile.template)
