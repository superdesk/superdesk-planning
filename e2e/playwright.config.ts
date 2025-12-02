import {defineConfig, devices} from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './playwright',
    /* Run tests in files in parallel */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: 3,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',

    // Let tests run up to 1 minute
    timeout: 60_000,

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:9000',

        viewport: {width: 1280, height: 800},

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-failure',

        screenshot: 'only-on-failure',

        /* our custom test id attribute */
        testIdAttribute: 'data-test-id',
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.05,
        },

        timeout: 10000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],

                launchOptions: {
                    args: [
                        '--disable-font-subpixel-positioning',
                    ],
                },
            },
        },
    ],
});
