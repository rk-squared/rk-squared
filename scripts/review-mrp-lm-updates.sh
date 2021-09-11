#!/bin/bash

set -e
cd "$(dirname "$0")"/..

export convert=enlir-lm-to-mrp.js
export before=tmp/mrp-lm-before.txt
export after=tmp/mrp-lm-after.txt
export diff=tmp/mrp-lm.diff

scripts/review-mrp-updates.sh
