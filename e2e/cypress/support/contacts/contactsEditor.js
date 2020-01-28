import {Editor} from '../common/editor';
import {Input} from '../common/inputs';
import {ContactEmailInput} from './contactEmailInput';

/**
 * Wrapper class for the Contacts editor
 * @extends Editor
 */
export class ContactsEditor extends Editor {
    /**
     * Creates an instance of the ContactsEditor wrapper
     */
    constructor() {
        super();
        this.fields = {
            honorific: new Input(() => this.element, 'input[name="honorific"]'),
            first_name: new Input(() => this.element, 'input[name="first_name"]'),
            last_name: new Input(() => this.element, 'input[name="last_name"]'),
            organisation: new Input(() => this.element, 'input[name="organisation"]'),
            job_title: new Input(() => this.element, 'input[name="job_title"]'),
            contact_email: new ContactEmailInput(() => this.element, 'email'),
        };
    }

    /**
     * Returns the dom node for the editor component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get('.contact-form');
    }

    /**
     * Returns the dom node for the create button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get createButton() {
        return this.element
            .contains('Save')
            .should('exist');
    }

    /**
     * Returns the dom node for the close button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get closeButton() {
        return this.element
            .contains('Cancel')
            .should('exist');
    }

    /**
     * Wait until the ContactsEditor component is no longer visible
     */
    waitTillClosed() {
        cy.log('Contacts.Editor.waitTillClosed');
        this.element.should('not.exist');
    }
}
