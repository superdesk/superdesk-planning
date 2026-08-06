To run e2e tests locally:

1. start grunt in e2e folder - `npx grunt server`
2. edit Procfile, remove the web task (it is for serving a static bundle which we don't want in order not to lose live-reload support)
3. start mongo, redis, elastic services
4. create a virtual environment in e2e/server, install dependencies and start honcho
5. run `E2E="true" TZ="Australia/Sydney" npm run playwright-interactive` in `e2e` folder. Notice we set a timezone environment variable before launching Playwright. Some tests depend on a timezone and would fail if the timezone was not set. The E2E environment variable needs to be set so a dedicated database for e2e is used instead of overwriting your local database.

Alternatively, `./e2e/scripts/e2e-up.sh` (from the repo root) brings up the whole dockerized stack with health checks and is idempotent; `./e2e/scripts/e2e-down.sh` tears it down.

## Parallel instances (slots)

Several e2e instances can run on one machine at the same time, for example when multiple agents author specs concurrently, each from its own git worktree. A slot shares the heavy docker services (mongo, elasticsearch, redis) with every other slot but gets its own backend container, mongo databases, elastic index prefix, redis DB, client build and ports.

```
./e2e/scripts/e2e-up.sh --slot auto    # claim the first free slot (1-5) and bring it up
./e2e/scripts/e2e-up.sh --slot 3       # bring up slot 3 specifically
./e2e/scripts/e2e-down.sh --slot 3     # tear down slot 3 and release it
./e2e/scripts/e2e-down.sh --all        # tear down all slots, the default stack and shared services
```

Slot N uses api `:502N`, websocket `:512N`, client `:902N`, and mongo databases / elastic indices named `sd_e2e_s<N>*`, all disjoint from the default stack (`:5002` / `:9000` / `e2e_superdesk`), so a normally started stack keeps working alongside slots. Claims are lock directories under `/tmp/superdesk-planning-e2e`, and re-running `e2e-up.sh --slot auto` from the same checkout re-enters its slot.

On success the slot's environment (including `TZ`) is written to `e2e/.e2e-slot.env` (gitignored). `playwright.config.ts` auto-loads it, so `npx playwright test` from that checkout targets the slot without further setup.

Notes for running several slots:

* One slot per checkout/worktree. The client build bakes the slot's backend URLs into `dist/`, and the slot env file lives in the checkout, so sharing a checkout between slots would clobber both.
* To seed a fresh worktree's dependencies quickly, clone them from the main checkout with a copy-on-write copy: `cp -Rc` on macOS (APFS), `cp -a --reflink=auto` on Linux (btrfs/XFS; falls back to a regular copy elsewhere). `npm ci`/`npm install` work everywhere but are much slower.
* The port ranges are disjoint from superdesk-client-core's slots (`:501N`), but the two repos' e2e stacks cannot run at the same time regardless: both bind 27017/6379/9200 on the host.
* Docker Desktop needs enough VM memory for the shared services plus one backend container per active slot; for 4-5 slots ~8 GB is recommended.
* Concurrent Chromium runs compete for CPU; parallel spec writing is free, but keep simultaneous test runs to 2-3 or expect timeout flakiness.
