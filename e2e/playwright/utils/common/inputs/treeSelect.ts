import {Locator, Page, expect} from '@playwright/test';
import {Input} from './input';
import {clickAll} from '../utils';

export class TreeSelect extends Input {
    allowMultiple: boolean;

    constructor(page: Page, getParent: () => Locator, selector: string, allowMultiple: boolean = false) {
        super(page, getParent, selector);
        this.allowMultiple = allowMultiple;
    }

    get addButton(): Locator {
        return this.allowMultiple ?
            this.parent.locator(`${this.selector} > .sd-input .tags-input__add-button`) :
            this.parent.locator(`${this.selector} button`);
    }

    async type(value: string | Array<string>): Promise<void> {
        const values = Array.isArray(value) ? value : [value];

        if (this.allowMultiple) {
            for (const val of values) {
                await this.addButton.click();
                await this.page
                    .getByTestId('tree-select-popover')
                    .getByTestId('options')
                    .getByRole('treeitem', {name: val, exact: true})
                    .click();
            }
        } else {
            const val = values[0];

            await this.addButton.click();
            await this.page.keyboard.type(val);
            await this.page
                .getByTestId('tree-select-popover')
                .locator('ul li')
                .first()
                .click();
        }
    }

    async expect(values: Array<string>): Promise<void> {
        for (const value of values) {
            await expect(this.element).toContainText(value);
        }
    }

    async expectValidData(valid: boolean = true): Promise<void> {
        if (valid) {
            expect(this.parent.locator(`${this.selector} .sd-input--invalid`)).not.toBeAttached();
        } else {
            expect(this.parent.locator(`${this.selector} .sd-input--invalid`)).toBeVisible();
        }
    }

    async clear(): Promise<void> {
        await clickAll(this.parent, `${this.selector} [data-test-id="item"] [data-test-id="remove"]`);
    }
}
