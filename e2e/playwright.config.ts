import {defineConfig, devices} from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * e2e-up.sh --slot writes the slot's environment (backend URL, client URL,
 * timezone) to .e2e-slot.env so tests run from this checkout target that slot
 * without any manual setup. Real environment variables win over the file.
 * Workers inherit process.env from this process, so setting values here also
 * covers playwright/utils (SUPERDESK_URL).
 */
const slotEnvPath = path.join(__dirname, '.e2e-slot.env');

if (fs.existsSync(slotEnvPath)) {
    for (const line of fs.readFileSync(slotEnvPath, 'utf-8').split('\n')) {
        const match = line.match(/^([A-Z_]+)=(.*)$/);

        if (match != null && process.env[match[1]] == null) {
            process.env[match[1]] = match[2];
        }
    }
}

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
    retries: 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',

    // Let tests run up to 1 minute
    timeout: 60_000,

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.CLIENT_URL || 'http://localhost:9000',

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
