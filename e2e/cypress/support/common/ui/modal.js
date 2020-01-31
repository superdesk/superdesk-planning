import {Popup} from './popup';

/**
 * Wrapper class for Superdesk's Modal component
 * @extends Popup
 */
export class Modal extends Popup {
    /**
     * Creates an instance of the Modal wrapper
     * @param {string} selector - The CSS selector to find the modal
     */
    constructor(selector = '.modal__dialog') {
        super(selector);
    }

    /**
     * Returns the dom node for a specific button in the footer
     * @param {string} label - The label on the button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    getFooterButton(label) {
        return this.element.find('.modal__footer')
            .contains(label);
    }
}
