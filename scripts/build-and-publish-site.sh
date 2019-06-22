#!/bin/bash

set -e

cd "$(dirname "$0")"/..

scripts/app-store-to-site.ts
yarn build-site
scripts/publish-site.sh
