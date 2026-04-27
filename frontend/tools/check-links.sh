#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

missing_count=0
checked_count=0

echo "Running HTML link/reference check in: $ROOT_DIR"

while IFS= read -r -d '' file; do
  while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue

    case "$ref" in
      http:*|https:*|mailto:*|tel:*|javascript:*|data:*|\#*)
        continue
        ;;
    esac

    clean_ref="${ref%%\?*}"
    clean_ref="${clean_ref%%#*}"

    if [[ "$clean_ref" == /frontend/* ]]; then
      target=".${clean_ref#/frontend}"
    elif [[ "$clean_ref" == /* ]]; then
      # External absolute paths are intentionally skipped.
      continue
    else
      target="$(dirname "$file")/$clean_ref"
    fi

    checked_count=$((checked_count + 1))

    if [[ ! -e "$target" ]]; then
      echo "MISSING: $file -> $clean_ref (resolved: $target)"
      missing_count=$((missing_count + 1))
    fi
  done < <(
    grep -oE '(href|src)="[^"]+"' "$file" | sed -E 's/^(href|src)="([^"]+)"$/\2/' || true
  )
done < <(find . -name '*.html' -print0)

echo "Checked refs: $checked_count"
echo "Missing refs: $missing_count"

if [[ $missing_count -gt 0 ]]; then
  exit 1
fi
