import { Input } from './input';

export class TimePickerInput extends Input {
    type(value: string) {
        this.getParent()
            .find(this.selector)
            .should('exist')
            .click()
            .clear({ force: true })
            .type(value, { force: true })
            .blur()
            .should('have.value', value);
    }
}
