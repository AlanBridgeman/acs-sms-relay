# Azure Communications Services (ACS) SMS Relay
The purpose of this software is to be able to relay a message from, for example, [Listmonk](https://listmonk.app/) to [Azure Communication Services (ACS)](https://azure.microsoft.com/en-us/products/communication-services) to send an SMS message.

1. [Getting Started](#getting-started)
2. [Architecture](#architecture)<br>
&nbsp;&nbsp;&nbsp;&nbsp;2.1. [API](#api)
3. [`.env`, `.env.deploy` and `.env.docker`. What? And Why?](#env-envdeploy-and-envdocker-what-and-why)<br>
&nbsp;&nbsp;&nbsp;&nbsp;3.1. [`.env`](#env)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.1.1. [Local Non-Containerized Deployment](#local-non-containerized-deployment)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.1.2. [Use within bash scripts to fill-in Kubernetes secrets](#use-within-bash-scripts-to-fill-in-kubernetes-secrets)<br>
&nbsp;&nbsp;&nbsp;&nbsp;3.2. [`.env.deploy`](#envdeploy)<br>
&nbsp;&nbsp;&nbsp;&nbsp;3.3. [`.env.docker`](#envdocker)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.3.1. [In Image `.env`](#in-image-env)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.3.2. [In Repository Reference](#in-repository-reference)
4. [Contributing, Issues and Pull Request](#contributing-issues-and-pull-request)

## BREAKING CHANGE
I recently made a change where this now relies on my [Listmonk Node Client library](https://github.com/AlanBridgeman/listmonk-nodejs-client) which, at least at time of writing, I host in a private repository. So, I do have an extra `.npmrc` file in my local setup (which is copied into the docker image at build time - which is OKAY because I host my docker images privately too. But should probably figure out another way in case I ever want to publish the image). This means for others to get this working you'll have to remove or change the `@BridgemanAccessible/listmonk-node-client` dependency from the [`package.json` file](./package.json) to get this working. If your using Docker or Kubernetes you'll also have to remove or change the `COPY .npmrc ./` line in the [Dockerfile](./Dockerfile).

## Getting Started
The easiest way to get started is to copy and complete a `.env` file (note the use of `cp` rather than `mv` because `.env.docker` gets copied into the docker image as `.env` [see section below](#envdocker) for more details):

```sh
cp .env.docker .env
# Can use any text editor you want (ex. `nano`, `code`, etc...) use `vim` here for purely an example
vim .env
```

Once that's filled out with the ACS and Listmonk credentials. Then you can run `./deploy.sh <IMAGE_REPOSITORY> <INGRESS_HOST>` right away (replacing the parameters with appropriate values of course).

OR

You can create a `.env.deploy` with the `IMAGE_REPOSITORY` and `INGRESS_HOST` values (see [`.env.deploy` section below](#envdeploy) for details)

## Architecture
In all honesty, it's a fairly straightforward MVC based [Express](https://expressjs.com/) app. At time of writing, the only view available is `/`. And that's a dead simple landing page. Eventually, I hope to build this out as a bit of a stats dashboard etc... But for right now the relaying works (using `/listmonk/send`) and that's good enough (for now).

### API
So far, the API is pretty sparse but hopefully it might be built up a bit over time.

| Path/Route       | Purpose                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `/listmonk/send` | [Listmonk Messenger](https://listmonk.app/docs/messengers/) endpoint for sending via SMS |

## `.env`, `.env.deploy` and `.env.docker`. What? And Why?
I know it might seem a bit overwhelming and confusing at first becaus I seem to have more .env files then most. But there are, at least in my mind, good reasons for this which I'll articulate in the proceeding sections.

### `.env`
The `.env` file is used/useful in 2 particular ways:
1. For local non-containerized deployment
2. For use within bash scripts to setup secrets properly within Kubernetes

It's important to note this is excluded from the git repository via the [`.giignore` file](./.gitignore) for security/privacy reasons.

#### Local Non-Containerized Deployment
If deployed in a none containerized way, which can be done by running `yarn build` and `yarn start` provided you have [Node](https://nodejs.org) installed. The needed credentials are loaded into environment variables using the [`dotenv` NPM package](https://www.npmjs.com/package/dotenv) which imports the `.env` file contents into environment variables.

#### Use within bash scripts to fill-in Kubernetes secrets
The other way the `.env` file gets used is within the bash scripts to replace values within the [`values.yaml` file](./k8s/chart/values.yaml) at deployment time. This is so that the secrets can get created properly. Moreover, we don't define these explicitly within the [`values.yaml` file](./k8s/chart/values.yaml) because it is part of the git repository (so that others can use the Helm chart if they'd like) but we don't want our credentials to be.

This `.env` file doesn't HAVE to exist, the values within the `.env` file can be set as environment variables separately and no `.env` file exist. This is mostly to compensate for, for example, CI/CD pipelines.

### `.env.deploy`
This might be a bit overkill and probably could be amalgamated with the `.env` file. But the purpose/theory is to define certain specific values that can also be provided as command line arguments to the bash deployment scripts. That is, at time of writing, the variables summarized in the table below:

| Variable         | Purpose                                                                | Script Argument Number |
| ---------------- | ---------------------------------------------------------------------- | ---------------------- |
| IMAGE_REPOSITORY | Where the docker image is pushed to (I use a private repository)       | 1                      |
| INGRESS_HOST     | The hostname to use for ingress to the container/service in Kubernetes | 2                      |

### `.env.docker`
This one is a little bit odd but it serves 2 primary purposes:
1. It's copied into the docker image as `.env` and is read/loaded at run time
2. An in repository reference for how to create the `.env`

#### In Image `.env`
Because the [`.env.docker` file](./.env.docker) is copied into the docker images as the `.env` file it could, theoretically, be used to define some non-sensitive environment variables. Keeping in mind any values in the image if the image is ever made public those variables become public too.

#### In Repository Reference
At least, at time of writing, the [`.env.docker` file](./.env.docker) is a direct copy of the `.env` file except with all the values removed. This means for anyone trying to use this software it's as easy as copy-pasting the file and renaming it to `.env` and filling in the values. This makes it easy and quick for people to get up and running without compromising on security.

## Contributing, Issues and Pull Request
Feel free to submit issues or pull requests when applicable. I make no promises about answering or any kind of updating/maintenance (particularly on any kind of schedule). But I will try to work with others to have this work for them as I can.