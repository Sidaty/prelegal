#!/usr/bin/env bash
# Builds the Prelegal image and starts it on http://localhost:8000
set -eo pipefail
cd "$(dirname "$0")/.."

docker build -t prelegal .
docker rm -f prelegal >/dev/null 2>&1 || true
env_file=()
[ -f .env ] && env_file=(--env-file .env)
docker run -d --name prelegal -p 8000:8000 "${env_file[@]}" prelegal
echo "Prelegal is starting on http://localhost:8000"
