#!/bin/bash
# Workflow:
# - Upload scripts/logo-big.png to https://iconverticons.com/online/.
# - Download the ICO, ICNS - Icns file, and PNG -> download all (zip).
# - Run this script.

set -e

filename=logo-big.png

cd "$(dirname "$0")"/../resources
cp -v ../scripts/$filename icons/1024x1024.png
unzip -jo ~/Downloads/$filename.zip -d icons
cp -v icons/256x256.png icon.png
cp -v ~/Downloads/$filename.icns icon.icns
cp -v ~/Downloads/$filename.ico icon.ico
