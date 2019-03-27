#!/bin/bash

set -e
cd "$(dirname "$0")"/..
scripts/enlir-to-mrp.ts >& tmp/mrp-after.txt
year=$(date +%Y)
diff <(perl -pe "s/^$year\\S+//" tmp/mrp-before.txt) <(perl -pe "s/^$year\\S+//" tmp/mrp-after.txt) > tmp/mrp.diff || true
${EDITOR:-vim} tmp/mrp.diff
