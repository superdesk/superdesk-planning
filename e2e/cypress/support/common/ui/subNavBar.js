/**
 * Wrapper class around Superdesk's SubNavBar components used in most pages of the app
 */
export class SubNavBar {
    /**
     * Returns the dom node for the subnavbar
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get('.subnav')
            .first();
    }

    /**
     * Returns the dom node for the plus button (top right hand corner, i.e. add)
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get plusBtn() {
        return this.element
            .find('.icon-plus-large')
            .should('exist');
    }

    get createMenu() {
        return this.element
            .find('ul.dropdown__menu')
            .should('exist');
    }

    get menuBtn() {
        return cy.get('.subnav + .subnav')
            .find('.icon-dots-vertical')
            .should('exist');
    }

    /**
     * Returns the dom node for the dropdown menu from the plus button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get menu() {
        return cy.get('.subnav + .subnav')
            .find('ul.dropdown__menu')
            .should('exist');
    }

    /**
     * Helper method to create a new Event
     */
    createEvent() {
        cy.log('Common.UI.SubNavBar.createEvent');
        this.plusBtn.click();
        this.createMenu
            .find('#create_event')
            .should('exist')
            .click();
    }

    /**
     * Helper method to create a new Planning item
     */
    createPlanning() {
        cy.log('Common.UI.SubNavBar.createPlanning');
        this.plusBtn.click();
        this.createMenu
            .find('#create_planning')
            .should('exist')
            .click();
    }

    /**
     * Helper method to create a new Contact
     */
    createContact() {
        cy.log('Common.UI.SubNavBar.createContact');
        this.plusBtn.click();
    }
}
