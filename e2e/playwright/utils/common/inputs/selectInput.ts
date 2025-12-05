import {expect} from '@playwright/test';
import {Input} from './input';

export class SelectInput extends Input {
    async type(value: string): Promise<void> {
        await this.element.selectOption(value);
    }

    async expect(value: any): Promise<void> {
        await expect(this.element.locator('option:checked')).toHaveText(value);
    }

    async clear(): Promise<void> {
        await this.element.selectOption('');
    }
}
