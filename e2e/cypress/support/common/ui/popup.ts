/**
 * Wrapper class for Superdesk's Popup component
 */
export class Popup {
    /**
     * Creates an instance of the Popup wrapper
     * @param {string} selector - The CSS selector to find the modal
     */
    constructor(selector = '.popup') {
        this.selector = selector;
    }

    /**
     * Returns the dom node for the popup
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get(this.selector);
    }

    /**
     * Waits until the popup is open, using the maximum timeout specified
     * @param {number} timeout - The timeout in milliseconds
     */
    waitTillOpen(timeout = 4000) {
        cy.log('Common.UI.Popup.waitTillOpen');
        cy.get(this.selector, {timeout: timeout})
            .should('exist');
    }

    /**
     * Waits until the popup is closed, using the maximum timeout specified
     * @param {number} timeout - The timeout in milliseconds
     */
    waitTillClosed(timeout = 4000) {
        cy.log('Common.UI.Popup.waitTillClosed');
        cy.get(this.selector, {timeout: timeout})
            .should('not.exist');
    }
}
