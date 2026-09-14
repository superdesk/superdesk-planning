import type {Page} from '@playwright/test';

/**
 * Rewrites the `client_config` response so a config-gated feature can be exercised
 * without changing the (static) e2e server configuration.
 *
 * The client reads `client_config` once, during boot, so the route has to be
 * registered before the first navigation. It stays registered for the life of the
 * page, so reloads get the same override.
 *
 * @param {Page} page - The Playwright page to intercept requests on.
 * @param {object} overrides - Config keys merged over the ones the server returns.
 * @return {Promise<void>} A promise that resolves once the route is registered.
 */
export async function overrideClientConfig(page: Page, overrides: {[key: string]: any}): Promise<void> {
    await page.route('**/client_config', async (route) => {
        const response = await route.fetch();
        const body = await response.json();

        await route.fulfill({
            response: response,
            json: {
                ...body,
                config: {
                    ...body.config,
                    ...overrides,
                },
            },
        });
    });
}

/**
 * Turns on the inline coverage form (`PLANNING_INLINE_COVERAGE_FORM` on the server).
 * Must be called before the first navigation, see {@link overrideClientConfig}.
 *
 * @param {Page} page - The Playwright page to intercept requests on.
 * @return {Promise<void>} A promise that resolves once the route is registered.
 */
export async function enableInlineCoverageForm(page: Page): Promise<void> {
    await overrideClientConfig(page, {planning_inline_coverage_form: true});
}
