# Writing end-to-end tests for superdesk-planning

How to write a Playwright end-to-end test in this repo. Read this before
authoring a spec. A companion doc exists in `superdesk-client-core`; the two
share most conventions but differ in authentication and state-reset, so do not
copy client-core's patterns verbatim here.

## TL;DR

Every new spec:

- Lives under `e2e/playwright/`, in the matching feature subdirectory
  (`events/`, `planning/`, `assignments/`, ...) where one exists, named after
  the behaviour under test.
- Selects elements with `page.getByTestId('...')` and locator chaining. The
  config already sets `testIdAttribute: 'data-test-id'`.
- Logs in per test: call `setup(...)` then `login(page)` in `beforeEach` (see
  "Authentication" for why this repo logs in per test rather than using a saved
  session).
- Seeds state with `setup(page, 'planning_prepopulate_data', url)`, plus
  `addItems(...)` for any extra fixtures the test needs.
- Asserts with web-first assertions (`await expect(locator).toBeVisible()`).
  Never `page.waitForTimeout(...)`.

## Where specs and helpers live

- Specs go under `e2e/playwright/`, grouped in the feature subdirectory that
  matches the area under test (`events/`, `planning/`, `assignments/`,
  `contacts/`, `locations/`, `search/`). Cross-cutting specs (`modals.spec.ts`,
  `workqueue.spec.ts`) sit at the `playwright/` root.
- Page Object classes live under `e2e/playwright/page-object-models/`, imported
  with local relative paths. Shared helper functions (`setup`, `login`,
  `addItems`, `resetApp`, `waitForPageLoad`) live in `utils/common` and are
  imported from there.
- There is no published helpers package. Do not import from
  `@superdesk/end-to-end-testing-helpers` or any `@superdesk/...` path for e2e
  helpers; it does not exist.

```ts
import {test, expect} from '@playwright/test';
import {setup, login, waitForPageLoad, addItems, Modal} from './utils/common';
import {EventEditor, PlanningList} from './page-object-models/planning';
```

## Selectors

Same as client-core: `page.getByTestId('...')` with locator chaining for scoped
lookups. This repo already uses `getByTestId` throughout, so there is no `s()`
legacy to translate here. Do not introduce CSS class chains, text matching for
actionable elements, or XPath.

```ts
await page.getByTestId('workspace-navigation').getByTestId('Planning').click();
```

## Authentication

This repo logs in per test. In `beforeEach`, call `setup(...)` then
`login(page)`:

```ts
test.beforeEach(async ({page}) => {
    editor = new EventEditor(page);

    await setup(page, 'planning_prepopulate_data', '/#/planning');
    await login(page);
    await waitForPageLoad.planning(page);
});
```

Why per-test login here, when client-core starts from a saved `storageState`?
client-core's saved session stays valid because its `restoreDatabaseSnapshot`
restores a snapshot that contains that session. This repo resets state with
`prepopulate` (`remove_first: true`), which wipes the database, including any
session, on every reset. A saved session would be invalidated by the next
reset. Migrating to `storageState` would require seeding a fixed session into
the prepopulate profile; that is deferred backend work. Until then, per-test
`login(page)` is the convention. `login(page)` already drives the form with
`getByTestId`.

## State reset and fixtures

`setup(page, profile, url)` navigates to `url` and resets the app by calling
`resetApp`, which posts to `/api/prepopulate` with `remove_first: true` (wipes
and reseeds from the named profile). The standard profile is
`planning_prepopulate_data`.

For state beyond the profile, add it with `addItems` after `setup`:

```ts
await addItems(
    page.request,
    'events',
    [createEventFor.today({slugline: 'Test Event for Spike', name: 'Test Event'})],
);
```

`addItems(request, resource, items)` posts to `/api/planning_prepopulate`. It is
planning-only; there is no equivalent in client-core. Fixture builders such as
`createEventFor` live under `utils/fixtures/`.

## Page Objects

Reuse the Page Object classes under `page-object-models/`. They take a `Page` in
the constructor and expose methods named after user operations. Instantiate them
in `beforeEach`:

```ts
let editor: EventEditor;

test.beforeEach(async ({page}) => {
    editor = new EventEditor(page);
    // ...
});
```

When an interaction is not covered by an existing method, add a method to the
relevant Page Object rather than inlining it. Keep Page Objects stateless beyond
holding the `Page`.

## Running tests

Bring up the stack with the bootstrap script from the repo root, then run
Playwright from `e2e/`.

```sh
# Bring up the stack (idempotent)
./e2e/scripts/e2e-up.sh

# Run one spec
cd e2e
npx playwright test playwright/<feature>/<scenario>.spec.ts

# Watch it execute
npx playwright test playwright/<feature>/<scenario>.spec.ts --headed

# Open a trace after a failure
npx playwright show-trace test-results/<run-id>/trace.zip

# Tear down
./e2e/scripts/e2e-down.sh
```

The backend defaults to `http://localhost:5002/api` (override via the
`SUPERDESK_URL` env var). The client is served on port 9000. Port 5000 is
avoided because macOS AirPlay Receiver answers on it.

## Common pitfalls

- `page.waitForTimeout(N)` to paper over a race is almost always wrong. Wait for
  the actual condition with a web-first assertion, which auto-retries.
- "Passes solo, fails in a suite" is a shared-state problem. Make sure
  `setup(...)` runs in `beforeEach`.
- The only acceptable product-source change from a test is adding a
  `data-test-id` attribute. Anything more belongs in a separate PR with product
  review.

## Reference specs

When writing a new spec, start from the closest of these curated examples, copy
its structure, and adapt:

<!-- TODO(exemplar): add the path(s) to the native reference spec(s) produced
     from a real QA test case (workstream W2). Until then, fall back to the
     closest existing spec under playwright/. -->
