import {Locator, Page, expect} from '@playwright/test';

export class Input {
    page: Page;
    getParent: () => Locator;
    selector: string;

    constructor(page: Page, getParent: () => Locator, selector: string) {
        this.page = page;
        this.getParent = getParent;
        this.selector = selector;
    }

    get parent(): Locator {
        return this.getParent();
    }

    get element(): Locator {
        return this.parent.locator(this.selector);
    }

    async type(value: string | Array<string>): Promise<void> {
        await this.clear();
        await this.element.fill(Array.isArray(value) ? value[0] : value);
    }

    async expect(value: any): Promise<void> {
        await expect(this.element.first()).toHaveValue(value);
    }

    async clear(): Promise<void> {
        await this.element.clear();
    }

    async expectError(message: string): Promise<void> {
        await expect(this.parent.locator(this.selector + ' ~ .sd-line-input__message')).toHaveText(message);
    }
}
