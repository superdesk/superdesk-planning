import {Locator, Page, expect} from '@playwright/test';

import {Input} from './input';
import {TreeSelectDriver} from './treeSelectDriver';

export class UrgencyTreeSelectInput extends Input {
    treeSelectDriver: TreeSelectDriver;

    constructor(page: Page, getParent: () => Locator, selector: string) {
        super(page, getParent, selector);
        this.treeSelectDriver = new TreeSelectDriver(page, getParent, selector);
    }

    async clear(): Promise<void> {
        await this.treeSelectDriver.type('');
    }

    async type(value: string): Promise<void> {
        await this.treeSelectDriver.type(value);
    }

    async expect(value: string): Promise<void> {
        await expect(this.element).toContainText(value);
    }
}
