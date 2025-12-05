import {Locator} from '@playwright/test';
import {Input} from './input';

export class NewCheckboxInput extends Input {
    get button(): Locator {
        return this.element.getByRole('checkbox');
    }

    async type(_value: any): Promise<void> {
        await this.button.click();
    }
}
