import {Page, Locator} from '@playwright/test';

export class Popup {
    page: Page;
    selector: string;

    constructor(page: Page, selector: string = '.popup') {
        this.page = page;
        this.selector = selector;
    }

    get element(): Locator {
        return this.page.locator(this.selector);
    }

    async waitTillOpen(timeout: number = 4000): Promise<void> {
        await this.element.waitFor({state: 'attached', timeout: timeout});
    }

    async waitTillClosed(timeout: number = 4000): Promise<void> {
        await this.element.waitFor({state: 'detached', timeout: timeout});
    }
}
