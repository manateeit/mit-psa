#!/bin/bash

# Check if a Docker Compose file is provided
if [ $# -lt 1 ]; then
    echo "Please provide a Docker Compose file as an argument."
    echo "Usage: $0 <docker-compose-file> [additional-args]"
    exit 1
fi

COMPOSE_FILE=$1
shift
ADDITIONAL_ARGS=$@

# Default network settings
NETWORK_NAME=app-network
USE_EXTERNAL_NETWORK=true

# Parse additional arguments
DOCKER_COMPOSE_ARGS=""
for arg in $ADDITIONAL_ARGS; do
    case $arg in
        --no-network)
            NETWORK_NAME=default
            USE_EXTERNAL_NETWORK=false
            ;;
        -d)
            DOCKER_COMPOSE_ARGS+=" -d"
            ;;
        --watch)
            DEV_MODE=true
            ;;
        *)
            DOCKER_COMPOSE_ARGS+=" $arg"
            ;;
    esac
done


# Function to clean up
cleanup() {
    echo "Cleaning up..."
    rm -f /tmp/.env
    #rm ./setup/setup.sql
}

# Set up trap to call cleanup function
trap cleanup EXIT

# Generate .env file from config.ini
echo "# Generated from prod.config.ini" > /tmp/.env
while IFS='=' read -r key value
do
    if [[ $key == \[*] ]]; then
        continue
    elif [[ $value ]]; then
        echo "${key}=${value}" >> /tmp/.env
    fi
done < prod.config.ini

#Initial setup
#./setup/setup.sh

# Add network configuration to .env
echo "NETWORK_NAME=${NETWORK_NAME}" >> /tmp/.env
echo "USE_EXTERNAL_NETWORK=${USE_EXTERNAL_NETWORK}" >> /tmp/.env
#echo "APP_ENV=${APP_ENV}" >> /tmp/.env

# Run docker-compose
if [ -f "$COMPOSE_FILE" ]; then
    echo "Running Docker Compose for $COMPOSE_FILE"
    if [ "$DEV_MODE" = true ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file /tmp/.env watch $DOCKER_COMPOSE_ARGS
    else
        docker-compose -f "$COMPOSE_FILE" --env-file /tmp/.env up $DOCKER_COMPOSE_ARGS
    fi
else
    echo "Docker Compose file $COMPOSE_FILE not found"
    exit 1
fi
