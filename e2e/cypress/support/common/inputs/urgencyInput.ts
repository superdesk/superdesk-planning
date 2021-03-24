import {Input} from './input';
import {Popup} from '../ui';

/**
 * Wrapper class for Superdesk's UrgencyInput component
 * @extends Input
 */
export class UrgencyInput extends Input {
    /**
     * Set the value for this input
     * First finds a button on this field to show the popup
     * Waits for the popup then clicks on the appropriate value
     * @param {string} value - The value to type into the input field
     */
    type(value) {
        cy.log('Common.UrgencyInput.type');
        const popup = new Popup();

        this.element
            .find('button')
            .click();
        popup.waitTillOpen();
        popup.element
            .find('.popup__menu-content')
            .contains(value)
            .should('exist')
            .parent()
            .should('exist')
            .click();
        popup.waitTillClosed();
    }

    /**
     * Assert the value of this input
     * @param {string} value - The value to expect
     */
    expect(value) {
        cy.log('Common.UrgencyInput.expect');
        this.element.should('contain.text', value);
    }
}
