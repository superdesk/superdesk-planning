import {Input} from './input';

export class TimePickerInput extends Input {
    async setToBeConfirmed(): Promise<void> {
        await this.element.press('Enter');
        await this.page.getByTestId('time-popup-tbc').click();
    }

    async type(value: string | Array<string>) {
        const valToType = Array.isArray(value) ? value[0] : value;

        await this.element.click();
        await this.element.clear();
        await this.element.fill(valToType);
    }
}
