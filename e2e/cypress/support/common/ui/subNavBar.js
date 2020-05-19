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
        return this.element.find('.icon-plus-large');
    }

    get menuBtn() {
        return this.element.find('.icon-dots-vertical');
    }

    /**
     * Returns the dom node for the dropdown menu from the plus button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get menu() {
        return this.element.find('ul.dropdown__menu');
    }

    /**
     * Helper method to create a new Event
     */
    createEvent() {
        cy.log('Common.UI.SubNavBar.createEvent');
        this.plusBtn.click();
        this.menu.find('#create_event')
            .click();
    }

    /**
     * Helper method to create a new Planning item
     */
    createPlanning() {
        cy.log('Common.UI.SubNavBar.createPlanning');
        this.plusBtn.click();
        this.menu.find('#create_planning')
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
