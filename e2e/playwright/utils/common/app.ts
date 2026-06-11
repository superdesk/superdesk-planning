import type {Page, APIRequestContext} from '@playwright/test';

export const baseBackendUrl = (process.env.SUPERDESK_URL || 'http://localhost:5002/api').replace(/\/$/, '');

/**
 * Resets the application state by sending a prepopulate request to the backend.
 *
 * @param {APIRequestContext} request - The API request context used to send the HTTP request.
 * @param {string} profile - The name of the profile to reset within the application.
 * @return {Promise<void>} A promise that resolves when the application state has been successfully reset.
 */
export async function resetApp(request: APIRequestContext, profile: string): Promise<void> {
    await request.post(
        `${baseBackendUrl}/prepopulate`,
        {
            failOnStatusCode: true,
            data: {profile: profile, remove_first: true},
        },
    );
}

/**
 * Adds items to a specific resource by sending a POST request to the backend.
 *
 * @param {APIRequestContext} request - The request context used to make the API request.
 * @param {string} resource - The resource to which the items will be added.
 * @param {Array<any>} items - The array of items to be added to the resource.
 * @return {Promise<void>} A promise that resolves when the items are successfully added.
 */
export async function addItems(request: APIRequestContext, resource: string, items: Array<any>): Promise<void> {
    await request.post(
        `${baseBackendUrl}/planning_prepopulate`,
        {
            failOnStatusCode: true,
            data: {resource: resource, items: items},
        },
    );
}

/**
 * Forces the unlock of a specified item by making a DELETE request to the backend API.
 *
 * @param {APIRequestContext} request - The API request context used to make the HTTP call.
 * @param {string} itemType - The type of the item to unlock.
 * @param {string} itemId - The unique identifier of the item to unlock.
 * @return {Promise<void>} A promise that resolves when the item has been successfully unlocked.
 */
export async function forceUnlockItem(request: APIRequestContext, itemType: string, itemId: string): Promise<void> {
    await request.delete(
        `${baseBackendUrl}/e2e/force_unlock/${itemType}/${itemId}`,
        {failOnStatusCode: true},
    );
}

/**
 * Logs into the application using provided credentials by interacting with the login form.
 *
 * @param {Page} page - The Playwright Page object representing the browser page to perform actions.
 * @return {Promise<void>} A promise that resolves when the login process is complete.
 */
export async function login(page: Page): Promise<void> {
    const loginPage = page.getByTestId('login-page');

    await loginPage.getByTestId('username').fill('admin');
    await loginPage.getByTestId('password').fill('admin');
    await loginPage.getByTestId('submit').click();
}

/**
 * Initializes the setup by navigating to a specified URL and resetting the application state for the provided profile.
 *
 * @param {Page} page - The Playwright page object used to perform navigation and actions.
 * @param {string} profile - The user profile identifier used to reset app state.
 * @param {string} url - The URL to navigate to before resetting the application.
 * @return {Promise<void>} A promise that resolves once the setup process is complete.
 */
export async function setup(page: Page, profile: string, url: string) {
    await page.goto(url);
    await resetApp(page.request, profile);
}

/**
 * Changes the current workspace by interacting with the workspace navigation element on the given page.
 *
 * @param {Page} page - The Playwright Page object representing the active browser page.
 * @param {string} name - The name of the workspace to navigate to.
 * @return {Promise<void>} A promise that resolves when the workspace has been successfully changed.
 */
export async function changeWorkspace(page: Page, name: string): Promise<void> {
    await page.getByTestId('workspace-navigation')
        .getByTestId(name)
        .click();
}
