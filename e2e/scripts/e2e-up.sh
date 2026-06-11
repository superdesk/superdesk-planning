#!/usr/bin/env bash
#
# Bring up the local end-to-end stack for superdesk-planning: server (docker
# compose) + client served as a static bundle. Mirrors superdesk-client-core's
# e2e/scripts/e2e-up.sh, adapted to planning's layout:
#   - Playwright runs from e2e/ (not e2e/client/).
#   - The docker stack is defined in e2e/docker-compose.yml.
#   - The client is built to e2e/dist and served on :9000 via http-server.
#
# The script is idempotent and health-checked, so it can be run repeatedly
# without wasted work.
#
# Usage (from repo root):
#   ./e2e/scripts/e2e-up.sh                  # bring up the stack
#   ./e2e/scripts/e2e-up.sh --reinstall      # force `npm ci` in e2e/
#   ./e2e/scripts/e2e-up.sh --rebuild        # force docker compose build + client rebuild
#
# Exits 0 only when both the server (e.g. http://localhost:5002/api/) and the
# client (http://localhost:9000/) respond. Otherwise exits non-zero with a
# clear error message.

set -euo pipefail

REINSTALL=false
REBUILD=false

for arg in "$@"; do
    case "$arg" in
        --reinstall) REINSTALL=true ;;
        --rebuild) REBUILD=true ;;
        *) echo "unknown argument: $arg" >&2; exit 2 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_DIR="$REPO_ROOT/e2e"
COMPOSE_PROJECT="superdesk-planning-e2e"

# SUPERDESK_URL is the single knob: point it at the e2e backend's /api root.
# PORT (the docker host bind for the server) is derived from it so that
# port-overriding (e.g. macOS AirPlay grabs 5000, 5050 is used elsewhere) needs
# only one export:
#   export SUPERDESK_URL=http://localhost:5002/api
SUPERDESK_URL="${SUPERDESK_URL:-http://localhost:5002/api}"
SERVER_URL="${SUPERDESK_URL%/}/"
CLIENT_URL="http://localhost:9000/"
SUPERDESK_HOST_PORT="$(printf '%s\n' "$SUPERDESK_URL" | sed -E 's#^https?://##; s#/.*$##')"
PORT="${PORT:-${SUPERDESK_HOST_PORT##*:}}"
export SUPERDESK_URL PORT

log() { printf '\n[e2e-up] %s\n' "$*"; }
fail() { printf '\n[e2e-up] ERROR: %s\n' "$*" >&2; exit 1; }

# Strict HTTP status (echoes the code, or 000 on connection failure). Unlike
# reachable(), this lets callers require a specific code, e.g. a real 200 on a
# bundle rather than "the port answered".
http_status() { curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo "000"; }

reachable() {
    # Any HTTP response counts as "up" — the superdesk e2e server returns 403
    # on /api/ without auth, which is a sign of life, not failure. We only
    # fail on connection-level errors (port closed, host unreachable).
    curl -sS --max-time 2 -o /dev/null "$1" 2>/dev/null
}

wait_until_reachable() {
    local url="$1"
    local name="$2"
    local timeout="${3:-180}"
    local elapsed=0

    until reachable "$url"; do
        if [ "$elapsed" -ge "$timeout" ]; then
            fail "$name not reachable at $url after ${timeout}s"
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done

    log "$name reachable at $url"
}

ensure_deps() {
    local dir="$1"
    if [ "$REINSTALL" = true ] || [ ! -d "$dir/node_modules" ]; then
        log "installing dependencies in $dir"
        (cd "$dir" && npm ci)
    fi
}

# Pre-flight: warn about host port conflicts.
# The e2e docker-compose maps mongo (27017), redis (6379), elasticsearch
# (9200), and the server ($PORT, 5100) to host ports. If the user has local
# instances of these running, docker compose will fail with port-in-use. We
# only warn and name the holding PIDs; we do not kill anything.
preflight_check_port() {
    local port="$1"
    local name="$2"
    if command -v lsof > /dev/null && lsof -ti:"$port" > /dev/null 2>&1; then
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null)
        # If our own stack already owns the port, that is fine.
        if docker compose -p "$COMPOSE_PROJECT" ps -q 2>/dev/null | grep -q .; then
            return 0
        fi
        cat >&2 <<EOF

[e2e-up] WARNING: Something is already listening on port $port ($name).
[e2e-up] docker compose may fail with a port conflict. Stop the local
[e2e-up] $name and re-run, or accept the conflict will block the e2e stack.
[e2e-up] PIDs holding port $port: $pids

EOF
        return 1
    fi
    return 0
}

# 1. Server (docker compose at e2e/docker-compose.yml)
if reachable "$SERVER_URL"; then
    log "server already reachable; skipping docker bring-up"
else
    preflight_check_port 27017 mongo || true
    preflight_check_port 6379 redis || true
    preflight_check_port 9200 elasticsearch || true
    preflight_check_port "$PORT" "superdesk server" || true

    log "bringing up server via docker compose (host port $PORT)"
    if [ "$REBUILD" = true ]; then
        (cd "$E2E_DIR" && docker compose build)
    fi
    (cd "$E2E_DIR" && docker compose up -d)
    wait_until_reachable "$SERVER_URL" "server" 240
fi

# 2. Dependencies
# The planning client (built below) resolves its modules from the repo-root
# node_modules, so install those first, then the e2e client deps. Mirrors CI:
# `npm ci` at the repo root ("Install Planning Client") then `npm install` in
# e2e ("Install E2E Client").
ensure_deps "$REPO_ROOT"
ensure_deps "$E2E_DIR"

# 3. Client build (build-tools -> e2e/dist; http-server serves that dir).
# Rebuild when forced, deps reinstalled, the app bundles are missing, OR the
# dist was built against a different SUPERDESK_URL. The last two matter because:
#   - a failed/partial build leaves a non-empty dist/ WITHOUT the bundles, so
#     "is dist empty?" is not a sufficient staleness test;
#   - the backend URL is baked into the bundle at build time (webpack
#     DefinePlugin), so a dist built for one port silently breaks on another.
REQUIRED_BUNDLES="app.bundle.js init.bundle.js app.bundle.css"
BUILD_META="$E2E_DIR/dist/.e2e-built-with"

client_build_complete() {
    for b in $REQUIRED_BUNDLES; do
        [ -f "$E2E_DIR/dist/$b" ] || return 1
    done
    return 0
}
build_url_matches() {
    [ -f "$BUILD_META" ] && [ "$(cat "$BUILD_META" 2>/dev/null)" = "$SUPERDESK_URL" ]
}

if [ "$REBUILD" = true ] || [ "$REINSTALL" = true ] || ! client_build_complete || ! build_url_matches; then
    if ! client_build_complete; then
        log "client bundles missing or incomplete; (re)building client"
    elif ! build_url_matches; then
        log "dist was built for a different backend URL; rebuilding for $SUPERDESK_URL"
    else
        log "building client (this is the slow step on a cold cache)"
    fi
    (cd "$E2E_DIR" && SUPERDESK_URL="$SUPERDESK_URL" npm run build)
    # A build can exit non-zero on warnings yet still leave a partial dist, and
    # build-tools can swallow webpack failures. Never serve a build we cannot
    # confirm produced the app bundles.
    client_build_complete || fail "client build finished but the app bundles are missing from dist/ ($REQUIRED_BUNDLES). The build failed; re-read the build output above and re-run with --rebuild."
    printf '%s\n' "$SUPERDESK_URL" > "$BUILD_META"
    log "client build complete (backend baked as $SUPERDESK_URL)"
fi

# 4. Client static server (http-server serving dist on :9000)
if reachable "$CLIENT_URL"; then
    log "client already reachable; skipping client server start"
else
    log "starting client server on $CLIENT_URL"
    (cd "$E2E_DIR" && npm run start-client-server)
    wait_until_reachable "$CLIENT_URL" "client" 60
fi

# Final health gate: the app entry bundle must actually be served with a 200.
# A 200 on / (index.html) is returned even when the bundles 404, which renders
# a blank page. This is the difference between "the port answers" and "the app
# works", and it is exactly the failure a non-technical user cannot diagnose.
bundle_status="$(http_status "${CLIENT_URL}app.bundle.js")"
if [ "$bundle_status" != "200" ]; then
    fail "client is up but app.bundle.js returns HTTP $bundle_status, the app would render blank. The build is incomplete; re-run: ./e2e/scripts/e2e-up.sh --rebuild"
fi

log "ready"
log "  server: $SERVER_URL"
log "  client: $CLIENT_URL"
log "Run e2e tests from $E2E_DIR, e.g. \`npm run playwright\`."
