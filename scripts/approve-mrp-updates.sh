#!/bin/bash

set -e
cd "$(dirname "$0")"/..
if [ -f tmp/mrp-before.txt ]; then
  mv tmp/mrp-before.txt{,.bak}
fi
cp -v tmp/mrp-{after,before}.txt