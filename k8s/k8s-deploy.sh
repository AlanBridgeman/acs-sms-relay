#!/bin/bash

# SET the IMAGE_REPOSITORY to the first additional argument passed to the script (if it exists)
if [ ! -z "$1" ]; then
  IMAGE_REPOSITORY=$1
fi

# SET the INGRESS_HOST to the second additional argument passed to the script (if it exists)
if [ ! -z "$2" ]; then
  INGRESS_HOST=$2
fi

# Replace the values with the appropriate values
if [ ! -z "$IMAGE_REPOSITORY" ]; then
  sed -i.bak "s|repository: .*|repository: $IMAGE_REPOSITORY|g" ./chart/values.yaml
fi

if [ ! -z "$INGRESS_HOST" ]; then
  sed -i.bak "s|host: .*|host: $INGRESS_HOST|g" ./chart/values.yaml
fi

# Import the environment variables from the .env file (if it exists)
if [ -f ../.env ]; then
  . ../.env
fi

# Replace the values with the appropriate values or exit if they are not provided
if [ ! -z "$SMS_CONNECTION_STRING" ] && [ ! -z "$SMS_FROM_NUMBER" ] && [ ! -z "$LISTMONK_HOST" ] && [ ! -z "$LISTMONK_USERNAME" ] && [ ! -z "$LISTMONK_PASSWORD" ]; then
  sed -i.bak "s|connectionString: .*|connectionString: \"$SMS_CONNECTION_STRING\"|g" ./chart/values.yaml
  sed -i.bak "s|fromNumber: .*|fromNumber: \"$SMS_FROM_NUMBER\"|g" ./chart/values.yaml
  sed -i.bak "s|hostname: .*|hostname: \"$LISTMONK_HOST\"|g" ./chart/values.yaml
  sed -i.bak "s|username: .*|username: \"$LISTMONK_USERNAME\"|g" ./chart/values.yaml
  sed -i.bak "s|password: .*|password: \"$LISTMONK_PASSWORD\"|g" ./chart/values.yaml
else
  echo "Please provide the required environment variables (either in the .env file or within the environment)."
  exit 1
fi

# Remove the backup file created by the sed command (if it exists) this is mostly for MacOS to function properly
if [ -f ./chart/values.yaml.bak ]; then
  rm ./chart/values.yaml.bak
fi

echo "Attempting deployment to Kubernetes using Helm..."

kubectl create ns acs-sms
helm install --namespace acs-sms -f ./chart/values.yaml acs-sms-relay ./chart

echo "Deployed to Kubernetes Successfully."