#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$E2E_DIR/server"
VENV_DIR="$SERVER_DIR/.venv"
REQ_HASH_FILE="$VENV_DIR/.requirements-hash"
PYTHON_VERSION_FILE="$SERVER_DIR/.python-version"

PYTHON="${PYTHON:-python3}"

REQUIRED_MINOR=$(cut -d. -f2 "$PYTHON_VERSION_FILE")

validate_python() {
    if ! command -v "$PYTHON" &>/dev/null; then
        echo "ERROR: '$PYTHON' not found." >&2
        echo "This project requires Python $(cat "$PYTHON_VERSION_FILE")+" >&2
        echo "Set PYTHON=/path/to/python3 or add it to your PATH." >&2
        exit 1
    fi

    local version minor
    version=$("$PYTHON" --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    minor=$(echo "$version" | cut -d. -f2)

    if [ "$minor" -lt "$REQUIRED_MINOR" ]; then
        echo "ERROR: Python $version found, but $(cat "$PYTHON_VERSION_FILE")+ is required." >&2
        echo "Set PYTHON=/path/to/python3 or update your PATH." >&2
        exit 1
    fi
}

compute_req_hash() {
    cat "$SERVER_DIR/core-requirements.txt" "$SERVER_DIR/requirements.txt" | shasum -a 256 | cut -d' ' -f1
}

check_python_version() {
    [ -f "$VENV_DIR/bin/python3" ] || return 1

    local venv_version system_version
    venv_version=$("$VENV_DIR/bin/python3" --version 2>/dev/null || echo "none")
    system_version=$("$PYTHON" --version 2>/dev/null || echo "unknown")

    [ "$venv_version" = "$system_version" ]
}

check_req_hash() {
    [ -f "$REQ_HASH_FILE" ] || return 1

    local current_hash stored_hash
    current_hash=$(compute_req_hash)
    stored_hash=$(cat "$REQ_HASH_FILE")

    [ "$current_hash" = "$stored_hash" ]
}

setup_venv() {
    if check_python_version && check_req_hash; then
        echo "Python venv is up to date, skipping."
        return 0
    fi

    if ! check_python_version; then
        echo "Creating Python venv with $($PYTHON --version)..."
        rm -rf "$VENV_DIR"
        "$PYTHON" -m venv "$VENV_DIR"
    fi

    echo "Upgrading pip..."
    "$VENV_DIR/bin/python3" -m pip install --quiet --upgrade pip

    echo "Installing Python dependencies..."
    (cd "$SERVER_DIR" && "$VENV_DIR/bin/pip" install --quiet -r requirements.txt)

    compute_req_hash > "$REQ_HASH_FILE"
    echo "Python venv ready."
}

setup_playwright() {
    echo "Installing Playwright browsers..."
    npx playwright install --with-deps chromium
}

validate_python
echo "Using: $($PYTHON --version)"

setup_venv
setup_playwright

echo "Setup complete. Run 'npm run e2e' to start tests."
