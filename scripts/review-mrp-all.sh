#!/bin/bash

set -e
cd "$(dirname "$0")"/..

scripts/review-mrp-updates.sh
scripts/review-mrp-ability-updates.sh
scripts/review-mrp-lm-updates.sh
