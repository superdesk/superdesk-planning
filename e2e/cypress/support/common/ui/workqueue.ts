interface IExpectItem {
    title?: string;
    icon?: string;
    active?: boolean;
}

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
        return this.panel.find('[data-test-id="workqueue-item"]');
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
        return this.items
            .eq(index)
            .find('[data-test-id="workqueue-item--title"]');
    }

    /**
     * Assert the title of a specific item in the workqueue
     * @param {number} index - The item index from within the workqueue
     * @param {string} title - The expected title of the item
     */
    expectTitle(index, title) {
        cy.log('Common.UI.Workqueue.expectTitle');
        this.getItem(index)
            .find('span')
            .should('contain.text', title);
    }

    expectIcon(index: number, icon: string) {
        cy.log('Common.UI.Workqueue.expectIcon');
        this.getItem(index)
            .find(icon)
            .should('exist');
    }

    expectActive(index: number) {
        cy.log('Common.UI.Workqueue.expectActive');
        this.items
            .eq(index)
            .should('have.attr', 'data-active', 'true');
    }

    expectNotActive(index: number) {
        cy.log('Common.UI.Workqueue.expectNotActive');
        this.items
            .eq(index)
            .should('not.have.attr', 'data-active', 'true');
    }

    expectItems(items: Array<IExpectItem>) {
        cy.log('Common.UI.Workqueue.expectItems');
        items.forEach((item, index) => {
            if (item.title != null) {
                this.expectTitle(index, item.title);
            }
            if (item.icon != null) {
                this.expectIcon(index, item.icon);
            }
            if (item.active != null) {
                item.active ?
                    this.expectActive(index) :
                    this.expectNotActive(index);
            }
        });
    }

    closeItem(index) {
        cy.log('Common.UI.Workqueue.closeItem');
        this.items
            .eq(index)
            .find('[data-test-id="close-icon"]')
            .should('exist')
            .click();
    }
}
