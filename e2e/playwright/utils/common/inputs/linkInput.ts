import {Locator, expect} from '@playwright/test';
import {Input} from './input';

export class LinkInput extends Input {
    get addButton(): Locator {
        return this.parent.getByTestId('event-links__add-new-button');
    }

    get inputs(): Locator {
        return this.parent.locator('.link-input__input');
    }

    async type(value: string | Array<string>, startingIndex: number = 0): Promise<void> {
        const values = Array.isArray(value) ? value : [value];

        for (let index = 0; index < values.length; index++) {
            await this.addButton.click();
            const input = new Input(
                this.page,
                this.getParent,
                `textarea[name="links[${startingIndex + index}]"]`,
            );

            await input.type(values[index]);
        }
    }

    async expect(values: Array<string>): Promise<void> {
        const currentValues = await this.inputs.allTextContents();

        for (const value of values) {
            expect(currentValues).toContain(value);
        }
    }
}
