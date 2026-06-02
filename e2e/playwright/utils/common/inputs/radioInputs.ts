import {Page, Locator} from '@playwright/test';

import {Input} from './index';

export class RadioInputs extends Input {
    buttonSelector: string;

    constructor(page: Page, getParent: () => Locator, selector: string, buttonSelector: string = '.sd-check__wrapper') {
        super(page, getParent, selector);

        this.buttonSelector = buttonSelector;
    }

    async type(value: string | Array<string>): Promise<void> {
        const enterValue = async (singleValue: string) => {
            await this.element
                .locator(this.buttonSelector)
                .getByText(singleValue)
                .click();
        };

        if (Array.isArray(value)) {
            for (const singleValue of value) {
                await enterValue(singleValue);
            }
        } else {
            await enterValue(value);
        }
    }

    async expect(_value: string): Promise<void> {
        // TODO: Implement this check
    }
}
