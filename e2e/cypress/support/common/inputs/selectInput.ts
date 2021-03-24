import {Input} from './input';

/**
 * Wrapper class for a generic Select input field
 * @extends Input
 */
export class SelectInput extends Input {
    /**
     * Clear the input then type the value into the input field
     * @param value
     */
    type(value) {
        cy.log('Common.SelectInput.type');
        this.element
            .select(value);
    }

    /**
     * Assert the value of this input
     * @param {string} value - The value to expect
     */
    expect(value) {
        cy.log('Common.SelectInput.expect');
        this.element
            .find(':checked')
            .should('contain.text', value);
    }

    clear() {
        cy.log('Common.SelectInput.clear');
        this.element.select('');
    }
}
