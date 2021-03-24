import {Input} from './input';
import {Popup} from '../ui';

/**
 * Wrapper class for a searchable user select input field
 * @extends Input
 */
export class UserSelectInput extends Input {
    type(value) {
        cy.log('Common.SearchableSelectInput.type');
        const popup = new Popup();

        this.element
            .find('input')
            .type(value);

        popup.waitTillOpen();
        popup.element
            .find('li')
            .first()
            .click();
        popup.waitTillClosed();
    }

    expect(value) {
        cy.log('Common.SearchableSelectInput.expect');
        this.element.should('contain.text', value);
    }
}
