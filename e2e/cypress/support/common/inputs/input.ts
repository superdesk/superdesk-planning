
/**
 * Wrapper class for a generic Input field
 */
export class Input {
    /**
     * Creates an instance of the Input wrapper
     * @param {function():Cypress.Chainable<JQuery<HTMLElement>>} getParent - Callback to retrieve the parent
     * @param {string} selector - The CSS selector to find the field
     */
    constructor(getParent, selector) {
        this.getParent = getParent;
        this.selector = selector;
    }

    /**
     * Returns the dom node for the parent of the input field
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get parent() {
        return this.getParent();
    }

    /**
     * Returns the dom node for this input
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return this.parent.find(this.selector);
    }

    /**
     * Clear the input then type the value into the input field
     * @param {string} value - The value to type into the input field
     */
    type(value) {
        cy.log('Common.Input.type');
        this.element
            .clear()
            .type(value);
    }

    /**
     * Assert the value of this input
     * @param {string} value - The value to expect
     */
    expect(value) {
        cy.log('Common.Input.expect');
        this.element
            .should('have.value', value);
    }

    clear() {
        cy.log('Common.Input.clear');
        this.element.clear();
    }

    expectError(message) {
        this.parent.find(this.selector + ' ~ .sd-line-input__message')
            .should('have.text', message);
    }
}
