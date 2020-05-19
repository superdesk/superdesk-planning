import {ActionMenu} from '../common/ui';

/**
 * Wrapper class around the Superdesk Planning module's preview panel
 */
export class PlanningPreview {
    /**
     * Returns the dom node for the preview panel component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get('.sd-preview-panel');
    }

    /**
     * Returns the dom node for the CLOSE button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get closeButton() {
        return this.element.find('.icon-close-small');
    }

    /**
     * Returns an ActionMenu instance from the preview
     * @returns {ActionMenu}
     */
    get actionMenu() {
        return new ActionMenu(() => this.element);
    }

    /**
     * Opens up the action menu and executes a specific action on it
     * @param {string} label - The label of the action to execute
     */
    clickAction(label) {
        cy.log('Planning.Preview.clickAction');
        this.actionMenu
            .open()
            .getAction(label)
            .click();
    }

    /**
     * Waits until the preview panel is visible
     */
    waitTillOpen() {
        cy.log('Planning.Preview.waitTillOpen');
        this.element.should('exist');
    }

    /**
     * Waits until the preview panel is no longer visible
     */
    waitTillClosed() {
        cy.log('Planning.Preview.waitTillClosed');
        this.element.should('not.exist');
    }
}
