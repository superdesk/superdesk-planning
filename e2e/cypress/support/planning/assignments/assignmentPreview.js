/**
 * Wrapper class around the preview panel in the Assignments page
 */
export class AssignmentPreview {
    /**
     * Returns the dom node for the preview panel component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get('.sd-preview-panel > .side-panel');
    }

    /**
     * Returns the dom node for the content section of the preview panel component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get content() {
        return this.element.find('.side-panel__content');
    }

    /**
     * Returns the dom node for the top tool section of the content panel component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get topTools() {
        return this.element.find('.side-panel__top-tools');
    }
}