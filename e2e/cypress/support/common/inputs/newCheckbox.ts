import {Input} from './input';

export class NewCheckboxInput extends Input {
    get button() {
        return this.element.find('.sd-check-new__input');
    }

    type(value) {
        cy.log('Common.NewCheckbox.type');
        this.button.click();
    }
}
