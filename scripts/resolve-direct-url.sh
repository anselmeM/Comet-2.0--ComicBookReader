#!/bin/sh
# Resolve DIRECT_URL for Prisma migrations (shared by CI workflows).
#
# Priority:
#   1. $DIRECT_URL if set (non-empty) — the explicitly configured secret.
#   2. Derived from $DATABASE_URL: Neon's non-pooled host is the pooled host
#      with "-pooler" removed (same credentials). connect_timeout=30 is
#      appended because direct endpoints are cold-start computes and Prisma's
#      default 5s connect timeout fails with P1002 before Neon wakes up.
#   3. Empty — caller should fall back to DATABASE_URL (pooled).
#
# Prints the resolved value to stdout. The URL may contain credentials, so
# callers must never log it.
resolve_direct_url() {
  if [ -n "$DIRECT_URL" ]; then
    printf '%s' "$DIRECT_URL"
    return
  fi

  derived="${DATABASE_URL/-pooler./.}"
  if [ "$derived" = "$DATABASE_URL" ]; then
    return # no -pooler host to strip; leave empty so prisma falls back
  fi

  case "$derived" in
    *\?*) printf '%s&connect_timeout=30' "$derived" ;;
    *) printf '%s?connect_timeout=30' "$derived" ;;
  esac
}

resolve_direct_url
