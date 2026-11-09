#!/bin/sh
set -eu
cd "$(dirname "$0")"
PORTFOLIO="$PWD"
BUNDLED_PYTHON="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
if [ -x "$BUNDLED_PYTHON" ]; then
  PYTHON="$BUNDLED_PYTHON"
else
  PYTHON=python3
fi
"$PYTHON" "$PORTFOLIO/build.py"
echo 'Open http://localhost:8000 to view the portfolio. Press Control-C to stop.'
exec "$PYTHON" -m http.server 8000 --bind 127.0.0.1 --directory "$PORTFOLIO/_site"
