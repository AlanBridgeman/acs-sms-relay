#!/bin/bash

# Load any environment variables in the .env.deploy file (if it exists)
if [ -f .env.deploy ]; then
  . .env.deploy
fi

# SET the IMAGE_REPOSITORY to the first additional argument passed to the script (if it exists)
if [ ! -z "$1" ]; then
  IMAGE_REPOSITORY=$1
fi

# SET the INGRESS_HOST to the second additional argument passed to the script (if it exists)
if [ ! -z "$2" ]; then
  INGRESS_HOST=$2
fi

# Check that the IMAGE_REPOSITORY variable has been set
if [ -z "$IMAGE_REPOSITORY" ]; then
  echo "Please provide the IMAGE_REPOSITORY within a .env.deploy file, as the first argument to the script or setting it as an environment variable"
  exit 1
fi

# Check that the INGRESS_HOST variable has been set
if [ -z "$INGRESS_HOST" ]; then
  echo "Please provide the INGRESS_HOST within a .env.deploy file, as the second argument to the script or setting it as an environment variable"
  exit 1
fi

echo "Building the docker image..."
docker build -t $IMAGE_REPOSITORY/acs-sms-relay .

echo "Pushing the image to $IMAGE_REPOSITORY..."
docker push $IMAGE_REPOSITORY/acs-sms-relay

echo "Prepareing to deploy to Kubernetes..."
cd k8s
./k8s-deploy.sh $IMAGE_REPOSITORY $INGRESS_HOST

cd ../
echo "Deployment complete."