import {Popup} from './popup';

export class UiFrameworkModal extends Popup {
    /**
     * Creates an instance of the Modal wrapper
     * @param {string} selector - The CSS selector to find the modal
     */
    constructor(selector = '.p-dialog') {
        super(selector);
    }

    get footer() {
        return this.element.find('.p-dialog-footer');
    }

    /**
     * Returns the dom node for a specific button in the footer
     * @param {string} label - The label on the button
     * @param {number} timeout - The ms timeout when getting the button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    getFooterButton(label, timeout = 3000, shouldExist = true) {
        return this.element.find('.p-dialog-footer')
            .contains(label, {timeout: timeout})
            .should('exist');
    }

    shouldContainTitle(title: string) {
        return this.element.find('.p-dialog-header')
            .should('exist')
            .contains(title);
    }
}
