import {expect} from '@playwright/test';
import {Input} from './input';


export class ToggleInput extends Input {
    async type(_value: any): Promise<void> {
        await this.element.getByRole('checkbox').click();
    }

    async expect(value: boolean): Promise<void> {
        if (value === true) {
            await expect(this.element.getByRole('checkbox')).toBeChecked();
        } else {
            await expect(this.element.getByRole('checkbox')).not.toBeChecked();
        }
    }
}
