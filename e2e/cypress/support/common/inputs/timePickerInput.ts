import { Input } from './input';

export class TimePickerInput extends Input {
    type(value: string | string[]) {
        const valToType = Array.isArray(value) ? value[0] : value;

        this.getParent()
            .find(this.selector)
            .should('exist')
            .click()
            .clear({ force: true })
            .invoke('val', valToType)
            .trigger('input')
            .trigger('change')
            .blur()
            .should('have.value', valToType);
    }
}
