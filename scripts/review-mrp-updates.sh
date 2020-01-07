#!/bin/bash

set -e
cd "$(dirname "$0")"/..

convert=${convert:-scripts/enlir-to-mrp.ts}
before=${before:-tmp/mrp-before.txt}
after=${after:-tmp/mrp-after.txt}
diff=${diff:-tmp/mrp.diff}

if ! $convert >& $after ; then
  # If enlir-to-mrp.ts failed, then show the likely error and abort.
  tail -n 20 $after
  echo Failed 1>&2
  exit 1
fi

# Optionally launch Beyond Compare, but don't run it if it's already running.
# "Already running" logic is currently unimplemented in MinGW.
if [ "$OSTYPE" != msys ]; then
  if command -v bcomp >& /dev/null; then
    if ! pgrep bcomp >& /dev/null; then
      bcomp $before $after &
    fi
  fi
fi

year=$(date +%Y)
diff <(perl -pe "s/^$year\\S+//" $before) <(perl -pe "s/^$year\\S+//" $after) > $diff || true
if [ -s $diff ]; then
  ${EDITOR:-vim} $diff
fi
