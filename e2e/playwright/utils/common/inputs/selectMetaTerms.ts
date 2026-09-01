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

    async clear(): Promise<void> {
        await clickAll(this.parent, `${this.selector} .sd-line-input__input li`);
    }
}
