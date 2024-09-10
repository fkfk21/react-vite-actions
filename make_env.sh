#! /bin/bash

USER_PID=$(id -u)
USER_GID=$(id -g)

echo "PID=${USER_PID}" > .env
echo "GID=${USER_GID}" >> .env

echo "Finish make .env file"

# docker build
docker compose build