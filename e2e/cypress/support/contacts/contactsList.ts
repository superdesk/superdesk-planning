/**
 * Wrapper class for Superdesk's MediaContacts list panel
 */
export class ContactsList {
    /**
     * Returns the dom node for the list component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get list() {
        return cy.get('#content-list');
    }

    /**
     * Returns the dom nodes for each item in the list
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    items() {
        return this.list.find('.sd-grid-item');
    }

    /**
     * Returns the dom node for a specific contact
     * @param {number} index - The index of the contact to retrieve
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    item(index) {
        return this.items()
            .eq(index);
    }

    /**
     * Asserts that the list is empty
     */
    expectEmpty() {
        cy.log('Contacts.List.expectEmpty');
        this.items()
            .should('not.exist');
    }

    /**
     * Asserts that the list has a specific number of contacts in it
     * @param {number} count - The expected number of contacts
     */
    expectItemCount(count) {
        cy.log('Contacts.List.expectItemCount');
        this.items()
            .should('have.length', count);
    }
}
