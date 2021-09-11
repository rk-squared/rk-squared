#!/bin/bash

set -e
cd "$(dirname "$0")"/..

export convert=enlir-abilities-to-mrp.js
export before=tmp/mrp-abilities-before.txt
export after=tmp/mrp-abilities-after.txt
export diff=tmp/mrp-abilities.diff

scripts/review-mrp-updates.sh
