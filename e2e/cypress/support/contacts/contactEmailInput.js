import {Input} from '../common/inputs';

/**
 * Wrapper class for Superdesk's MediaContact email input
 * @extends Input
 */
export class ContactEmailInput extends Input {
    /**
     * Returns the dom node for the entire component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return this.parent
            .find('.form__row')
            .contains(this.selector)
            .should('exist')
            .parent()
            .should('exist');
    }

    /**
     * Returns the dom node for the add button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get addButton() {
        return this.element
            .find('button');
    }

    /**
     * Generates and returns the CSS selector for the specific email entry
     * @param {number} index - The index of the email in the array
     * @returns {string}
     */
    getSelector(index) {
        return `input[name="contact_email[${index}]"]`;
    }

    /**
     * Add all the provided email values to this component
     * @param {Array<string>} values - The list of email addresses to add
     * @param {number} startingIndex - The starting index to begin adding from
     */
    type(values, startingIndex = 0) {
        cy.log('Contacts.EmailInput.type');
        cy.wrap(values).each((value, index) => {
            this.addButton.click();
            const input = new Input(
                this.getParent,
                this.getSelector(startingIndex + index)
            );

            input.type(value);
        });
    }

    /**
     * Replace the email address at a specific index
     * @param {number} index - The index of the email address to replace
     * @param {string} value - The new email address to enter
     */
    replace(index, value) {
        cy.log('Contacts.EmailInput.replace');
        const input = new Input(
            this.getParent,
            this.getSelector(index)
        );

        input.type(value);
    }

    /**
     * Assert the email values in this component
     * @param {Array<String>} values - The list of expected email addresses
     * @param {number} startingIndex - The starting index to begin checking from
     */
    expect(values, startingIndex = 0) {
        cy.log('Contacts.EmailInput.expect');
        cy.wrap(values).each((value, index) => {
            this.element
                .find(this.getSelector(startingIndex + index))
                .should('have.value', value);
        });
    }
}
