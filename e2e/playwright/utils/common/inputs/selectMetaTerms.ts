import {expect} from '@playwright/test';
import {Input} from './input';
import {clickAll} from '../utils';


export class SelectMetaTerms extends Input {
    get addButton() {
        return this.parent.locator(`${this.selector} > .sd-line-input > .dropdown__toggle`);
    }

    async type(value: string | Array<string>): Promise<void> {
        const values = Array.isArray(value) ? value : [value];

        for (const val of values) {
            await this.addButton.click();
            await this.page.keyboard.type(val);
            await this.page.keyboard.press('ArrowDown');
            await this.page.keyboard.press('Enter');
        }
    }

    async expect(values: Array<string>): Promise<void> {
        for (const value of values) {
            await expect(this.element).toContainText(value);
        }
    }

    async expectEmpty(): Promise<void> {
        await expect(this.parent.locator(`${this.selector} .sd-line-input__input li`)).toHaveCount(0);
    }

    async expectRequired(): Promise<void> {
        await expect(this.element.locator('.sd-line-input')).toHaveClass(/--required\b/);
    }

    async expectError(message: string): Promise<void> {
        await expect(this.element.locator('.sd-line-input')).toHaveClass(/--invalid\b/);
        await expect(this.element.locator('.sd-line-input__message')).toHaveText(message);
    }

    async expectNoError(): Promise<void> {
        await expect(this.element.locator('.sd-line-input')).not.toHaveClass(/--invalid\b/);
        await expect(this.element.locator('.sd-line-input__message')).not.toBeVisible();
    }

    async clear(): Promise<void> {
        await clickAll(this.parent, `${this.selector} .sd-line-input__input li`);
    }
}
