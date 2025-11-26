import {expect} from '@playwright/test';
import {Input} from './input';

export class UserSelectInput extends Input {
    async type(value: string): Promise<void> {
        await this.element.click();
        await this.page.locator('.p-dropdown-panel input').fill(value);
        await this.page
            .locator('.p-dropdown-panel li')
            .first()
            .click();
    }

    async expect(value: string): Promise<void> {
        await expect(this.page.locator('.p-dropdown-panel')).toContainText(value);
    }
}
