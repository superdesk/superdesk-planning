/**
 * Wrapper class around Superdesk's Workqueue components used in most pages of the app
 */
export class Workqueue {
    /**
     * Returns the dom node for the workqueue
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get panel() {
        return cy.get('.opened-articles-bar');
    }

    /**
     * Returns the dom nodes for all items in the workqueue
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get items() {
        return this.panel.find('.opened-articles-bar__item');
    }

    /**
     * Assert the number of items in the workqueue
     * @param {number} count - The expected number of items in the workqueue
     */
    expectItemCount(count) {
        cy.log('Common.UI.Workqueue.expectItemCount');
        this.items.should('have.length', count);
    }

    /**
     * Returns the dom node for a specific item in the workqueue
     * @param {number} index - The item index from within the workqueue
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    getItem(index) {
        return this.items.eq(index).find('a');
    }

    /**
     * Assert the title of a specific item in the workqueue
     * @param {number} index - The item index from within the workqueue
     * @param {string} title - The expected title of the item
     */
    expectTitle(index, title) {
        cy.log('Common.UI.Workqueue.expectTitle');
        cy.log('UI.Workqueue.expectTitle');
        this.getItem(index)
            .find('span')
            .should('contain.text', title);
    }
}
