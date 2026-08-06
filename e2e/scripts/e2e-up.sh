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
#   ./e2e/scripts/e2e-up.sh                  # bring up the default stack (api :5002, client :9000)
#   ./e2e/scripts/e2e-up.sh --reinstall      # force dependency reinstall (repo root + e2e/)
#   ./e2e/scripts/e2e-up.sh --rebuild        # force docker compose build + client rebuild
#   ./e2e/scripts/e2e-up.sh --slot auto      # claim a numbered slot for a parallel instance
#   ./e2e/scripts/e2e-up.sh --slot 3         # bring up slot 3 specifically
#
# Slots (parallel instances):
#   A slot is an isolated e2e instance that shares the heavy docker services
#   (mongo, elastic, redis) with every other slot but gets its own backend
#   container, mongo databases, elastic index prefix, redis DB, client build
#   and ports. Slot N uses api :502N, websocket :512N, client :902N and
#   databases named sd_e2e_s<N>*. Slots exist so several agents can author
#   specs concurrently, one slot per git checkout/worktree. (The port ranges
#   are disjoint from superdesk-client-core's slots, but the two repos' e2e
#   stacks still cannot run at the same time: both bind 27017/6379/9200.)
#
#   Slots are claimed via lock directories under /tmp/superdesk-planning-e2e.
#   `--slot auto` re-enters a slot already claimed by this checkout, else
#   picks the first free one. Release with ./e2e/scripts/e2e-down.sh --slot N.
#
#   On success the slot environment is written to e2e/.e2e-slot.env.
#   playwright.config.ts auto-loads that file, so `npx playwright test` run
#   from this checkout targets the slot with no extra setup.
#
# Exits 0 only when both the server (SUPERDESK_URL, default
# http://localhost:5002/api/) and the client (default http://localhost:9000/)
# respond. Otherwise exits non-zero with a clear error message.

set -euo pipefail

REINSTALL=false
REBUILD=false
SLOT="${E2E_SLOT:-}"

while [ $# -gt 0 ]; do
    case "$1" in
        --reinstall) REINSTALL=true ;;
        --rebuild) REBUILD=true ;;
        --slot)
            shift
            [ $# -gt 0 ] || { echo "--slot needs a value: 1-5 or auto" >&2; exit 2; }
            SLOT="$1"
            ;;
        *) echo "unknown argument: $1" >&2; exit 2 ;;
    esac
    shift
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_DIR="$REPO_ROOT/e2e"
COMPOSE_PROJECT="superdesk-planning-e2e"

MAX_SLOTS=5
SLOT_LOCK_ROOT="${E2E_SLOT_LOCK_ROOT:-/tmp/superdesk-planning-e2e}"
SERVER_IMAGE="superdesk-planning-e2e-server:latest"
INFRA_SERVICES="elastic redis mongo"

log() { printf '\n[e2e-up] %s\n' "$*"; }
fail() { printf '\n[e2e-up] ERROR: %s\n' "$*" >&2; exit 1; }

# --- slot claiming -----------------------------------------------------------

slot_lock_dir() { echo "$SLOT_LOCK_ROOT/slot-$1.lock"; }
slot_owner() { head -n 1 "$(slot_lock_dir "$1")/owner" 2>/dev/null || true; }

# mkdir is atomic, so two concurrent claims of the same slot cannot both
# succeed. Re-entrant for the checkout that already owns the slot, so
# re-running e2e-up.sh is safe.
claim_slot() {
    local n="$1"
    local lock
    lock="$(slot_lock_dir "$n")"
    mkdir -p "$SLOT_LOCK_ROOT"
    if mkdir "$lock" 2>/dev/null; then
        printf '%s\n' "$REPO_ROOT" > "$lock/owner"
        printf 'claimed %s pid=%s\n' "$(date '+%Y-%m-%dT%H:%M:%S')" "$$" >> "$lock/owner"
        return 0
    fi
    [ "$(slot_owner "$n")" = "$REPO_ROOT" ]
}

if [ "$SLOT" = "auto" ]; then
    SLOT=""
    # prefer a slot this checkout already owns, so re-runs do not leak claims
    for n in $(seq 1 "$MAX_SLOTS"); do
        if [ "$(slot_owner "$n")" = "$REPO_ROOT" ]; then SLOT="$n"; break; fi
    done
    if [ -z "$SLOT" ]; then
        for n in $(seq 1 "$MAX_SLOTS"); do
            if claim_slot "$n"; then SLOT="$n"; break; fi
        done
    fi
    [ -n "$SLOT" ] || fail "no free slot (1-$MAX_SLOTS). Inspect $SLOT_LOCK_ROOT for holders; release a stale one with ./e2e/scripts/e2e-down.sh --slot <N>."
    log "using slot $SLOT"
elif [ -n "$SLOT" ]; then
    case "$SLOT" in
        ''|*[!0-9]*) fail "--slot must be 1-$MAX_SLOTS or auto, got: $SLOT" ;;
    esac
    { [ "$SLOT" -ge 1 ] && [ "$SLOT" -le "$MAX_SLOTS" ]; } || fail "--slot must be 1-$MAX_SLOTS, got: $SLOT"
    claim_slot "$SLOT" || fail "slot $SLOT is claimed by $(slot_owner "$SLOT"). If that checkout is done with it, release it: ./e2e/scripts/e2e-down.sh --slot $SLOT"
fi

# --- URL and name derivation -------------------------------------------------

if [ -n "$SLOT" ]; then
    if [ -n "${SUPERDESK_URL:-}" ]; then
        log "note: --slot overrides the ambient SUPERDESK_URL (${SUPERDESK_URL})"
    fi
    PORT=$((5020 + SLOT))
    WSPORT=$((5120 + SLOT))
    CLIENT_PORT=$((9020 + SLOT))
    SUPERDESK_URL="http://localhost:$PORT/api"
    SUPERDESK_WS_URL="ws://localhost:$WSPORT"
    CLIENT_URL="http://localhost:$CLIENT_PORT"
    # sd_e2e_s<N> (not e2e_superdesk_s<N>): the elastic flush that runs on
    # reset deletes indices matching <prefix>_*, so slot names must form
    # their own family and the capi name must not extend the main prefix.
    E2E_DB="sd_e2e_s$SLOT"
    E2E_CAPI_DB="sd_e2e_capi_s$SLOT"
    E2E_PAPI_DB="sd_e2e_papi_s$SLOT"
    # DBs 11-15: the default stack uses redis DB 1, and kombu prefixes fanout
    # channels with the DB number, so distinct DBs isolate notifications too.
    # The hostname is the compose service name; slots join the same network.
    REDIS_URL="redis://redis:6379/$((10 + SLOT))"
    SLOT_PROJECT="sd-planning-e2e-s$SLOT"
    export SUPERDESK_URL SUPERDESK_WS_URL PORT WSPORT CLIENT_URL REDIS_URL
    export E2E_DB E2E_CAPI_DB E2E_PAPI_DB
else
    # SUPERDESK_URL is the single knob: point it at the e2e backend's /api root.
    # PORT (the docker host bind for the server) is derived from it so that
    # port-overriding (e.g. macOS AirPlay grabs 5000, 5050 is used elsewhere) needs
    # only one export:
    #   export SUPERDESK_URL=http://localhost:5002/api
    SUPERDESK_URL="${SUPERDESK_URL:-http://localhost:5002/api}"
    SUPERDESK_WS_URL="${SUPERDESK_WS_URL:-}"
    CLIENT_URL="http://localhost:9000"
    CLIENT_PORT=9000
    SUPERDESK_HOST_PORT="$(printf '%s\n' "$SUPERDESK_URL" | sed -E 's#^https?://##; s#/.*$##')"
    PORT="${PORT:-${SUPERDESK_HOST_PORT##*:}}"
    case "$PORT" in
        ''|*[!0-9]*)
            fail "could not derive a numeric backend port from SUPERDESK_URL=\"$SUPERDESK_URL\". Include an explicit port, e.g. http://localhost:5002/api."
            ;;
    esac
    export SUPERDESK_URL PORT
fi

SERVER_URL="${SUPERDESK_URL%/}/"

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
    local install_cmd="${2:-npm ci}"
    if [ "$REINSTALL" = true ] || [ ! -d "$dir/node_modules" ]; then
        log "installing dependencies in $dir ($install_cmd)"
        (cd "$dir" && $install_cmd)
    fi
}

# The slot compose file references the image by name only; the default
# project owns the build config. Build it there when it is missing.
ensure_server_image() {
    if ! docker image inspect "$SERVER_IMAGE" > /dev/null 2>&1; then
        log "server image $SERVER_IMAGE not found; building it (one-time, slow)"
        (cd "$E2E_DIR" && docker compose build server)
    fi
}

# Pre-flight: warn about host port conflicts.
# The e2e docker-compose maps mongo (27017), redis (6379), elasticsearch
# (9200), and the server ($PORT, websocket) to host ports. If the user has
# local instances of these running, docker compose will fail with port-in-use.
# We only warn and name the holding PIDs; we do not kill anything.
preflight_check_port() {
    local port="$1"
    local name="$2"
    local project="${3:-$COMPOSE_PROJECT}"
    if command -v lsof > /dev/null && lsof -ti:"$port" > /dev/null 2>&1; then
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null)
        # If our own stack already owns the port, that is fine.
        if docker compose -p "$project" ps -q 2>/dev/null | grep -q .; then
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
if [ -n "$SLOT" ]; then
    ensure_server_image

    # Shared infra services live in the default compose project, so a slot
    # coexists with the default stack and with other slots. `up -d` on
    # already-running services is a no-op, and it creates the bridge network
    # the slot server joins.
    if ! docker compose -p "$COMPOSE_PROJECT" ps -q 2>/dev/null | grep -q .; then
        preflight_check_port 27017 mongo || true
        preflight_check_port 6379 redis || true
        preflight_check_port 9200 elasticsearch || true
    fi
    log "ensuring shared docker services are up ($INFRA_SERVICES)"
    # --no-recreate: never let a worktree's compose invocation recreate (and,
    # with tmpfs data, wipe) an infra service another slot is using.
    (cd "$E2E_DIR" && docker compose up -d --no-recreate $INFRA_SERVICES)

    if reachable "$SERVER_URL"; then
        log "slot $SLOT server already reachable; skipping docker bring-up"
    else
        preflight_check_port "$PORT" "superdesk server (slot $SLOT)" "$SLOT_PROJECT" || true
        preflight_check_port "$WSPORT" "websocket server (slot $SLOT)" "$SLOT_PROJECT" || true
        log "bringing up slot $SLOT server via docker compose (project $SLOT_PROJECT, host port $PORT)"
        (cd "$E2E_DIR" && docker compose -f docker-compose.slot.yml -p "$SLOT_PROJECT" up -d)
        wait_until_reachable "$SERVER_URL" "server (slot $SLOT)" 240
    fi
else
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
fi

# 2. Dependencies
# The planning client (built below) resolves its modules from the repo-root
# node_modules, so install those first, then the e2e client deps. Mirror CI
# exactly: `npm ci` at the repo root ("Install Planning Client") and `npm
# install` in e2e ("Install E2E Client"). e2e/ uses npm install because its
# `file:../` and `github:` deps don't sit cleanly under npm ci.
ensure_deps "$REPO_ROOT" "npm ci"
ensure_deps "$E2E_DIR" "npm install"

# 3. Client build (build-tools -> e2e/dist; http-server serves that dir).
# Rebuild when forced, deps reinstalled, the app bundles are missing, OR the
# dist was built against different backend URLs. The last two matter because:
#   - a failed/partial build leaves a non-empty dist/ WITHOUT the bundles, so
#     "is dist empty?" is not a sufficient staleness test;
#   - the backend api and websocket URLs are baked into the bundle at build
#     time (webpack DefinePlugin), so a dist built for one slot silently
#     breaks on another.
REQUIRED_BUNDLES="app.bundle.js init.bundle.js app.bundle.css"
BUILD_META="$E2E_DIR/dist/.e2e-built-with"

client_build_complete() {
    for b in $REQUIRED_BUNDLES; do
        [ -f "$E2E_DIR/dist/$b" ] || return 1
    done
    return 0
}
build_meta_current() { printf '%s\n%s\n' "$SUPERDESK_URL" "${SUPERDESK_WS_URL:-}"; }
build_url_matches() {
    [ -f "$BUILD_META" ] && [ "$(cat "$BUILD_META" 2>/dev/null)" = "$(build_meta_current)" ]
}

if [ "$REBUILD" = true ] || [ "$REINSTALL" = true ] || ! client_build_complete || ! build_url_matches; then
    if ! client_build_complete; then
        log "client bundles missing or incomplete; (re)building client"
    elif ! build_url_matches; then
        log "dist was built for different backend URLs; rebuilding for $SUPERDESK_URL"
    else
        log "building client (this is the slow step on a cold cache)"
    fi
    (cd "$E2E_DIR" && SUPERDESK_URL="$SUPERDESK_URL" SUPERDESK_WS_URL="${SUPERDESK_WS_URL:-}" npm run build)
    # A build can exit non-zero on warnings yet still leave a partial dist, and
    # build-tools can swallow webpack failures. Never serve a build we cannot
    # confirm produced the app bundles.
    client_build_complete || fail "client build finished but the app bundles are missing from dist/ ($REQUIRED_BUNDLES). The build failed; re-read the build output above and re-run with --rebuild."
    build_meta_current > "$BUILD_META"
    log "client build complete (backend baked as $SUPERDESK_URL)"
fi

# 4. Client static server (http-server serving dist on $CLIENT_PORT)
if reachable "$CLIENT_URL/"; then
    log "client already reachable; skipping client server start"
else
    if [ -n "$SLOT" ]; then
        preflight_check_port "$CLIENT_PORT" "client server (slot $SLOT)" "$SLOT_PROJECT" || true
    fi
    log "starting client server on $CLIENT_URL/"
    (cd "$E2E_DIR" && CLIENT_PORT="$CLIENT_PORT" npm run start-client-server)
    wait_until_reachable "$CLIENT_URL/" "client" 60
fi

# Final health gate: the app entry bundle must actually be served with a 200.
# A 200 on / (index.html) is returned even when the bundles 404, which renders
# a blank page. This is the difference between "the port answers" and "the app
# works", and it is exactly the failure a non-technical user cannot diagnose.
bundle_status="$(http_status "$CLIENT_URL/app.bundle.js")"
if [ "$bundle_status" != "200" ]; then
    fail "client is up but app.bundle.js returns HTTP $bundle_status, the app would render blank. The build is incomplete; re-run: ./e2e/scripts/e2e-up.sh --rebuild"
fi

# 5. Slot hand-off: environment file for playwright.
if [ -n "$SLOT" ]; then
    # TZ matches what RUNNING_LOCALLY.md prescribes for test runs; some specs
    # assert on dates and fail in other timezones. The config's env loader
    # only applies values that are not already set in the environment.
    cat > "$E2E_DIR/.e2e-slot.env" <<EOF
E2E_SLOT=$SLOT
SUPERDESK_URL=$SUPERDESK_URL
SUPERDESK_WS_URL=$SUPERDESK_WS_URL
CLIENT_URL=$CLIENT_URL
CLIENT_PORT=$CLIENT_PORT
TZ=Australia/Sydney
PLAYWRIGHT_HTML_OPEN=never
EOF
    log "slot environment written to e2e/.e2e-slot.env (auto-loaded by playwright.config.ts)"
else
    # A leftover slot env file would silently redirect playwright at a slot
    # stack; the default stack must not inherit it.
    rm -f "$E2E_DIR/.e2e-slot.env"
fi

log "ready"
if [ -n "$SLOT" ]; then
    log "  slot:   $SLOT (release with ./e2e/scripts/e2e-down.sh --slot $SLOT)"
fi
log "  server: $SERVER_URL"
log "  client: $CLIENT_URL/"
log "Run e2e tests from $E2E_DIR, e.g. \`npm run playwright\`."
