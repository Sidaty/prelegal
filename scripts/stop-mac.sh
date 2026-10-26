#!/usr/bin/env bash
# Stops and removes the Prelegal container (its database goes with it).
set -euo pipefail

docker rm -f prelegal
echo "Prelegal stopped"
