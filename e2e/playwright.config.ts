import {defineConfig, devices} from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './playwright',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: process.env.CI
        ? parseInt(process.env.PW_WORKERS || '4')
        : undefined,
    reporter: 'html',
    timeout: 60_000,

    webServer: {
        command: 'npx http-server dist -p 9000 -s --cors',
        port: 9000,
        reuseExistingServer: !process.env.CI,
        timeout: 10_000,
    },

    use: {
        baseURL: 'http://localhost:9000',
        viewport: {width: 1280, height: 800},
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        testIdAttribute: 'data-test-id',
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.05,
        },
        timeout: 10000,
    },

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
