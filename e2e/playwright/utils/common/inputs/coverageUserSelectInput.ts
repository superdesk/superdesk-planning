import {expect} from '@playwright/test';

import {Input} from './input';
import {Popup} from '../ui';

export class CoverageUserSelectInput extends Input {
    async type(value: string): Promise<void> {
        const popup = new Popup(this.page, '[data-test-id="tree-select-popover"]');

        await this.element.click();
        await popup.waitTillOpen();
        await popup.element.locator('[data-test-id="filter-input"]').fill(value);
        await popup.element.locator('li').click();
        await popup.waitTillClosed();
    }

    async expect(value: string): Promise<void> {
        await expect(this.element).toContainText(value);
    }
}
