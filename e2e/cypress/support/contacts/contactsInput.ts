import {Popup} from '../common/ui';
import {Input} from '../common/inputs';

/**
 * Wrapper class for Superdesk's MediaContact input component
 * @extends Input
 */
export class ContactsInput extends Input {
    /**
     * Creates an instance of the ContactsInput wrapper
     * @param {function():Cypress.Chainable<JQuery<HTMLElement>>} getParent - Callback to retrieve the parent
     * @param {string} selector - The CSS selector to find the field
     */
    constructor(getParent, selector) {
        super(getParent, selector);

        this.popup = new Popup();
    }

    /**
     * Returns the dom node for the ContactsInput component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get container() {
        return this.parent.find(this.selector);
    }

    /**
     * Returns the dom node for the search input field
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return this.container.find('.sd-line-input__input');
    }

    /**
     * Returns the dom node for the list of contacts added
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get list() {
        return this.container.find('.contact-metadata');
    }

    /**
     * Returns the dom node for the results in the search results popup
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    results() {
        this.popup.waitTillOpen();
        return this.popup.element.find('.Select__popup__item');
    }

    /**
     * Returns the dom node for a specific result in the search results popup
     * @param {number} index - The result index to retrieve
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    result(index) {
        return this.results()
            .eq(index);
    }

    /**
     * Removes a contact from the list of contacts added
     * @param {number} index - The index of the contact to remove
     */
    remove(index) {
        cy.log('Contacts.Input.remove');
        this.list
            .eq(index)
            .find('.icon-trash')
            .click({force: true}); // icon is only shown on hover
    }

    /**
     * Enters a search query into the input field
     * @param {string} text - The search query to enter
     */
    search(text) {
        cy.log('Contacts.Input.search');
        this.element
            .clear()
            .type(text);
    }

    /**
     * Clicks on the edit icon of the specific contact
     * @param {number} index - The index of the contact to edit
     */
    editContact(index) {
        cy.log('Contacts.Input.editContact');
        this.list
            .eq(index)
            .find('.icon-pencil')
            .click({force: true}); // icon is only show on hover
    }

    /**
     * Adds the list of contacts to the component
     * First search for the contact
     * Then select the first item in the results popup
     * @param {Array<string>} contacts - The list of contacts to add
     */
    type(contacts) {
        cy.log('Contacts.Input.type');
        cy.wrap(contacts).each(
            (contact) => {
                this.search(contact);
                this.result(0).click();
            }
        );
    }

    /**
     * Assert the list of contacts are in the results popup
     * @param {Array<Array<string>>} contacts - The array of strings to check
     */
    expectResults(contacts) {
        cy.log('Contacts.Input.expectResults');
        this.results()
            .should('have.length', contacts.length);

        cy.wrap(contacts).each((contact, index) => {
            contact.forEach((value) => {
                this.result(index)
                    .should('contain.text', value);
            });
        });
    }

    /**
     * Assert the list of contacts have been added to the component
     * @param {Array<string>} contacts - The list of contacts to check
     */
    expect(contacts) {
        cy.log('Contacts.Input.expect');
        this.list.should('have.length', contacts.length);

        cy.wrap(contacts).each(
            (contact, index) => {
                this.list.eq(index).should('contain.text', contact);
            }
        );
    }
}
