import {Page, Locator, expect} from '@playwright/test';

export class ContactsList {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    get list(): Locator {
        return this.page.locator('#content-list');
    }

    items(): Locator {
        return this.list.locator('.sd-grid-item');
    }

    item(index: number): Locator {
        return this.items().nth(index);
    }

    async expectEmpty(): Promise<void> {
        await expect(this.items()).not.toBeVisible();
    }

    async expectItemCount(count: number): Promise<void> {
        await expect(this.items()).toHaveCount(count);
    }
}
