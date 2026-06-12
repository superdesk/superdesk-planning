import {Locator, expect} from '@playwright/test';
import {Input} from '../../utils/common';

export class ContactEmailInput extends Input {
    get element(): Locator {
        return super.parent.getByTestId(this.selector);
    }

    get addButton(): Locator {
        return this.element.getByRole('button');
    }

    getSelector(index: number): string {
        return `input[name="contact_email[${index}]"]`;
    }

    async type(values: Array<any>, startingIndex: number = 0): Promise<void> {
        for (let index = 0; index < values.length; index++) {
            await this.addButton.click();
            const input = new Input(
                this.page,
                this.getParent,
                this.getSelector(startingIndex + index)
            );

            await input.type(values[index]);
        }
    }

    async replace(index: number, value: any): Promise<void> {
        const input = new Input(
            this.page,
            this.getParent,
            this.getSelector(index)
        );

        await input.type(value);
    }

    async expect(values: Array<any>, startingIndex: number = 0): Promise<void> {
        for (let index = 0; index < values.length; index++) {
            await expect(this.element.locator(this.getSelector(startingIndex + index))).toHaveValue(values[index]);
        }
    }
}
