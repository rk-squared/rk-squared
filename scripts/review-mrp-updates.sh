#!/bin/bash

set -e
cd "$(dirname "$0")"/..

if ! scripts/enlir-to-mrp.ts >& tmp/mrp-after.txt ; then
  # If enlir-to-mrp.ts failed, then show the likely error and abort.
  tail -n 20 tmp/mrp-after.txt
  echo Failed 1>&2
  exit 1
fi

year=$(date +%Y)
diff <(perl -pe "s/^$year\\S+//" tmp/mrp-before.txt) <(perl -pe "s/^$year\\S+//" tmp/mrp-after.txt) > tmp/mrp.diff || true
${EDITOR:-vim} tmp/mrp.diff
