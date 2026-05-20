# E2E consolidation on Playwright — migration report

## Frameworks found in this repo
- Cypress (count: 1)

## Totals
- Original non-Playwright specs: 1
- Migrated: 0
- Blocked: 0 (see below)
- Obsolete: 0 (see below)
- Flaky: 0 (see below)
- Redundant: 1 (see below)

## Migrated specs
- None

## Blocked
- None

## Obsolete
- None

## Flaky
- None

## Redundant
- Cypress `e2e/cypress/e2e/planning/agendas.cy.ts` — Given a planning workspace prepopulated with the Sports and Politics agendas, when a user opens the Manage agendas modal and shows, edits, validates, and creates agendas, then the modal reflects those agenda changes — covered by `e2e/playwright/planning/agendas.spec.ts`. The Cypress spec also imports `../../support/common`, `../../support/common/ui/ui-framework-modal`, and `../../fixtures/planning`, which do not exist in this repository, so it could not run cleanly.

## Product source changes
- None

## Frameworks removed
- Cypress — orphaned spec, Cypress-specific `.gitignore` entries, and local-running doc references removed (commit sha: final cleanup commit / HEAD)
