import {Locator} from '@playwright/test';
import {Input} from './input';

export class NewCheckboxInput extends Input {
    get button(): Locator {
        return this.element.locator('.sd-check-new__input');
    }

    async type(_value: any): Promise<void> {
        await this.button.click();
    }
}
