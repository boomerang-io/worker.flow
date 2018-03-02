# Boomerang Docker Worker

The purpose of this image is to provide a base foundation for Boomerang CI with the ability to produce other Docker images, run UrbanCode processes, etc

## How to use

*Build Image Locally*
`docker build -t bmrg-worker-worker .`

*Run Image Locally*
`docker run --add-host="ucd-server:ucd.boomerangplatform.net" -v /var/run/docker.sock:/var/run/docker.sock -ti bmrg-worker-docker`

## References

- *Docker*
URL: https://github.com/docker-library/docker/blob/master/Dockerfile.template

This is the base FROM image and itself is based off Alpine.

- *IBM Java*
URL: https://github.com/ibmruntimes/ci.docker/blob/350fc7d1664027c52636f77768b0832616576c52/ibmjava/8/sfj/alpine/Dockerfile

The install steps are borrwed from this Dockerfile to add on top of Docker

- *Git*
We add in a git dependency

- *UrbanCode*
URL: https://github.com/IBM-UrbanCode/UCD-Docker-Images
Install the UrbanCode Agent. The scripts and installers are borrowed from the official UrbanCode Agent Image
