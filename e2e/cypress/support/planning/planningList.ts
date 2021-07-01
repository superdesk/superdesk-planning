import {ActionMenu} from '../common/ui';
import {getMenuItem} from '../common/ui/actionMenu';

/**
 * Wrapper class around the Superdesk Planning module's list panel
 */
export class PlanningList {
    /**
     * Returns the dom node for the panel component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get panel() {
        return cy.get('.sd-column-box__main-column__listpanel');
    }

    /**
     * Returns the dom nodes for all the items in the list
     * @param timeout
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    items(timeout = 40000) {
        return this.panel.find('.sd-list-item', {timeout: timeout});
    }

    /**
     * Returns the dom node for a specific item in the list
     * @param {number} index - The index of the item to retrive
     * @param {number} timeout - The timeout in milliseconds
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    item(index, timeout = 40000) {
        return this.items(timeout)
            .eq(index);
    }

    /**
     * Returns the dom nodes for the events with planning items attached
     * @param {number} timeout - The timeout in milliseconds
     * @returns {Cypress.Chainable<JQuery<HTMLElementTagNameMap[string]>> | Cypress.Chainable<JQuery<HTMLElement>>}
     */
    nestedItems(timeout = 40000) {
        return this.panel.find('.sd-list-item-nested', {timeout: timeout});
    }

    /**
     * Returns the dom node for a specific event item with planning items attached
     * @param {number} index - The index of the item to retrieve
     * @param {number} timeout - The timeout in milliseconds
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    nestedItem(index, timeout = 40000) {
        return this.nestedItems(timeout)
            .eq(index);
    }

    nestedPlanningItems(index: number, timeout: number = 40000) {
        return this.nestedItem(index, timeout)
            .find('>> .sd-list-item');
    }

    nestedPlanningItem(itemIndex: number, planIndex: number, timeout: number = 40000) {
        return this.nestedPlanningItems(itemIndex, timeout)
            .eq(planIndex);
    }

    /**
     * Returns an ActionMenu instance for a specific item in the list
     * @param {number} index - The index of the item to retrieve the menu for
     * @returns {ActionMenu}
     */
    getActionMenu(index) {
        return new ActionMenu(
            () => this.item(index)
        );
    }

    /**
     * Executes an action on a specific item based on index and action label
     * @param {number} index - The index of the item to action on
     * @param {string} label - The label of the action to execute
     */
    clickAction(index, label) {
        cy.log('Planning.List.clickAction');

        this.item(index).click();

        getMenuItem(this.item(index), label).click();
    }

    /**
     * Assert that the list is empty
     */
    expectEmpty() {
        cy.log('Planning.List.expectEmpty');
        this.items()
            .should('not.exist');
    }

    /**
     * Assert the list has a specific number of items in it
     * @param {number} count - The expected number of items in the list
     * @param {number} timeout - The ms timeout when getting the list
     */
    expectItemCount(count, timeout = 40000) {
        cy.log('Planning.List.expectItemCount');
        // Use a greater timeout here to give the server and client time to finish the request
        this.items(timeout)
            .should('have.length', count);
    }

    /**
     * Assert that a specific item in the list has specific text contained within it
     * @param {number} index - The index of the specfic item to check
     * @param {string} text - The text expected to be found within the dom nodes
     * @param {Object} options - The options to pass into when finding the dom nodes
     */
    expectItemText(index, text, options = {}) {
        cy.log('Planning.List.expectItemText');
        this.item(index, options)
            .should('contain.text', text);
    }

    /**
     * Toggles showing or hiding the associated planning items of an Event
     * @param {number} index - The index of the item to toggle visibility of the associated planning for
     */
    toggleAssociatedPlanning(index) {
        cy.log('Planning.List.toggleAssociatedPlanning');
        this.nestedItem(index)
            .find('.icon-calendar')
            .click();
    }
}
