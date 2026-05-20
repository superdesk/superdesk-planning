To run e2e tests locally:

1. start grunt in e2e folder - `npx grunt server`
2. edit Procfile, remove the web task (it is for serving a static bundle which we don't want in order not to lose live-reload support)
3. start mongo, redis, elastic services
4. create a virtual environment in e2e/server, install dependencies and start honcho
5. run `E2E="true" TZ="Australia/Sydney" npm run playwright-interactive` in `e2e` folder. Notice we set a timezone environment variable before launching Playwright. Some tests depend on a timezone and would fail if the timezone was not set. The E2E environment variable needs to be set so a dedicated database for e2e is used instead of overwriting your local database.
