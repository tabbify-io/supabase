#!/bin/sh
# Tabbify fork: let ONE prebuilt Studio image serve any deployment.
#
# `next build` inlines the base path and the browser addresses into the bundle,
# and the platform serves every Studio under its own `/app/<uuid>`. Building per
# deployment made each new Supabase wait for a full `next build`. The prebuilt
# image is instead built with PLACEHOLDERS (see .github/workflows/
# tabbify-studio-image.yml), and this script writes the deployment's real values
# over them once, at boot, before Studio starts:
#
#   TABBIFY_STUDIO_BASE_PATH  where the platform serves this app, `/app/<uuid>/`
#   TABBIFY_STUDIO_SITE_URL   the deployment's public address
#
# The base path placeholder is exactly as long as `/app/<uuid>`: a minifier may
# fold a literal's `.length` into a number, so any other length would be refused
# rather than silently mis-slice paths. An image built with real values (the
# source build) carries no placeholder, and this script then changes nothing.
set -eu

APP_DIR=/app/apps/studio
BASE_PLACEHOLDER=/app/ffffffff-tbfy-base-path-placeholder0
SITE_PLACEHOLDER=https://tabbify-studio-site.invalid
SITE_PLACEHOLDER_RE='https://tabbify-studio-site\.invalid'
MARKER="$APP_DIR/.tabbify-placeholders-written"

if [ -n "${TABBIFY_STUDIO_BASE_PATH:-}" ] || [ -n "${TABBIFY_STUDIO_SITE_URL:-}" ]; then
  base=$(printf '%s' "${TABBIFY_STUDIO_BASE_PATH:-}" | sed 's:/*$::')
  site=$(printf '%s' "${TABBIFY_STUDIO_SITE_URL:-}" | sed 's:/*$::')
  wanted="$base $site"
  if [ ! -f "$MARKER" ]; then
    if ! printf '%s' "$base" | grep -Eq '^/app/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'; then
      echo "tabbify: TABBIFY_STUDIO_BASE_PATH must be /app/<uuid>/, got '${TABBIFY_STUDIO_BASE_PATH:-}'" >&2
      exit 1
    fi
    # The value lands in a sed replacement: only URL characters, never `|`, `&` or `\`.
    if ! printf '%s' "$site" | grep -Eq '^https?://[A-Za-z0-9._~:/?#@!()*+,;=%-]+$'; then
      echo "tabbify: TABBIFY_STUDIO_SITE_URL must be an http(s) URL, got '${TABBIFY_STUDIO_SITE_URL:-}'" >&2
      exit 1
    fi
    grep -rlF -e "$BASE_PLACEHOLDER" -e "$SITE_PLACEHOLDER" "$APP_DIR" | while IFS= read -r file; do
      sed -i "s|$BASE_PLACEHOLDER|$base|g; s|$SITE_PLACEHOLDER_RE|$site|g" "$file"
    done
    printf '%s\n' "$wanted" > "$MARKER"
  elif [ "$(cat "$MARKER")" != "$wanted" ]; then
    # The placeholders are gone; a second set of values cannot be written.
    echo "tabbify: this filesystem was prepared for '$(cat "$MARKER")', not '$wanted'" >&2
    exit 1
  fi
fi

exec docker-entrypoint.sh "$@"
