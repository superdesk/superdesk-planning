import type {Page} from '@playwright/test';

export async function login(page: Page): Promise<void> {
    const loginPage = page.getByTestId('login-page');

    await loginPage.getByTestId('username').fill('admin');
    await loginPage.getByTestId('password').fill('admin');
    await loginPage.getByTestId('submit').click();
}

export async function changeWorkspace(page: Page, name: string): Promise<void> {
    await page.getByTestId('workspace-navigation')
        .getByTestId(name)
        .click();
}
