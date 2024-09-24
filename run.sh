#!/usr/bin/env bash

# Validate
if ! command -v docker &> /dev/null
then
  echo "Docker must be installed to run this."
  exit 1
fi

# Run
docker compose up -d;
