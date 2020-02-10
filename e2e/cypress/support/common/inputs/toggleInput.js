import {Input} from './input';

/**
 * Wrapper class for Superdesk-UI-Framework ToggleInput component
 * @extends Input
 */
export class ToggleInput extends Input {
    /**
     * Clicks on the input field to toggle the value
     * @param {boolean} value - True if the toggle should be on, false otherwise
     */
    type(value) {
        cy.log('Common.ToggleInput.type');
        this.element
            .click()
            .should('have.class', 'checked');
    }

    /**
     * Assert the value of this input
     * @param {boolean} value - True if the toggle should be on, false otherwise
     */
    expect(value) {
        cy.log('Common.ToggleInput.expect');
        this.element.should(
            value ? 'have.class' : 'not.have.class',
            'checked'
        );
    }
}
