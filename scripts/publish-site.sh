#!/bin/bash

set -e

cd "$(dirname "$0")/.."

dest=../rk-squared.github.io

if [ ! -d $dest ]; then
  echo $dest does not exist 1>&2
  exit 1
fi

rm -rfv $dest/*
cp -av build/* $dest
(cd $dest &&
  git checkout -- README.md CNAME &&
  git add . &&
  git commit -m Publish &&
  git push)
