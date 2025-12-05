import {Locator, expect} from '@playwright/test';
import {Input} from './input';

export class LocationInput extends Input {
    get inputElement(): Locator {
        return this.page.locator(`${this.selector} .sd-line-input__input`);
    }

    get listItem(): Locator {
        return this.page.locator(`${this.selector} .sd-list-item`);
    }

    get popup(): Locator {
        return this.page.locator('.addgeolookup__popup');
    }

    get addNewButton(): Locator {
        return this.page.getByTestId('location-search__create-new');
    }

    async search(value: string): Promise<void> {
        await this.inputElement.fill(value);
        await this.popup.waitFor({state: 'visible'});
    }

    async type(value: string): Promise<void> {
        await this.inputElement.fill(value);
        await this.popup.locator('.addgeolookup__item').waitFor({state: 'visible'});
        await this.popup
            .locator('.addgeolookup__item')
            .getByText(value)
            .waitFor({state: 'visible'});
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
    }

    async expect(value: string): Promise<void> {
        await expect(this.listItem).toContainText(value);
    }

    async clear(): Promise<void> {
        await this.listItem.hover();
        await this.listItem.locator('.icon-trash').click();
    }
}
