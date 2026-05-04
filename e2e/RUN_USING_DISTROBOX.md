# Running Playwright using Distrobox

Distrobox provides an isolated Ubuntu container for running Playwright on non-Ubuntu hosts.

## Setup

1. Install Distrobox and Podman (or Docker) on your host:
```bash
# Fedora
sudo dnf install distrobox podman
```

2. Create the container:
```bash
mkdir -p ~/distrobox
distrobox create \
  --name ubuntu-playwright \
  --image ubuntu:24.04 \
  --home ~/distrobox/ubuntu-playwright \
  --additional-packages "git vim nodejs npm"
```

3. Enter the container and install Playwright:
```bash
distrobox enter ubuntu-playwright
cd e2e
npx playwright install --with-deps chromium
```

## Running tests

Infrastructure services (Mongo, Elastic, Redis) must be running on the host. Start them from the `e2e/` directory:

```bash
npm run e2e:services:up
```

Then inside the Distrobox container:

```bash
# Full suite
npm run playwright

# Single file
npm run playwright -- playwright/events/edit_event.spec.ts

# Interactive UI mode
npm run playwright-interactive
```

Stop services when done:
```bash
npm run e2e:services:down
```
