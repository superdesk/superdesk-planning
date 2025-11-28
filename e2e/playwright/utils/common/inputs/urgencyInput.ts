import {expect} from '@playwright/test';

import {Input} from './input';
import {Popup} from '../ui';

export class UrgencyInput extends Input {
    async type(value: string): Promise<void> {
        const popup = new Popup(this.page, '[data-test-id="coloured-popup-contents"]');

        await this.element.locator('button').click();
        await popup.waitTillOpen();
        await popup.element
            .locator('.popup__menu-content')
            .getByText(value)
            .locator('xpath=..')
            .click();
        await popup.waitTillClosed();
    }

    async expect(value: string): Promise<void> {
        await expect(this.element).toContainText(value);
    }
}
