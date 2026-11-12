#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Commit the desired changes to main before running this script.
git push origin main
git subtree push --prefix dist origin gh-pages
