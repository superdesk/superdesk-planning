import { Input } from './input';

export class TimePickerInput extends Input {
    type(value: string) {
        this.getParent()
            .find(this.selector)
            .should('exist')
            .click()
            .type(value.replace(':', '') + '{enter}');
    }
}
