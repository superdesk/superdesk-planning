import {get} from 'lodash';
import {ActionMenu} from './ui';

/**
 * Wrapper class around Superdesk Editors (i.e. Planning/Event/Contact Editors)
 */
export class Editor {
    /**
     * Creates an instance of the Editor instance. This is designed to be inherited from
     * @param {string} itemIcon - The selector used to identify the type of Editor based on the icon
     */
    constructor(itemIcon, autosavePrefix) {
        this.itemIcon = itemIcon;
        this.fields = {};
        this.autosavePrefix = autosavePrefix;
    }

    /**
     * Returns the dom node for this editor
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get element() {
        return cy.get('.sd-edit-panel');
    }

    /**
     * Returns the dom node for the create button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get createButton() {
        return this.element.find('#create');
    }

    get saveButton(): Cypress.Chainable<JQuery> {
        return this.element.find('#save');
    }

    /**
     * Returns the dom node for the post button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get postButton() {
        return this.element.find('#post');
    }

    get unpostButton() {
        return this.element.find('#unpost');
    }

    /**
     * Returns the dom node for the close button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get closeButton() {
        return this.element.find('#close');
    }

    /**
     * Returns the dom node for the minimise button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get minimiseButton() {
        return this.element.find('button[title="Minimise"]');
    }

    /**
     * Returns the dom node for the action menu in the header
     * @returns {ActionMenu}
     */
    get actionMenu() {
        return new ActionMenu(() => this.element);
    }

    /**
     * Returns the Input instance for the field based on the configured fields variable
     * @param {string} name - The name of the field to get the Input instance from
     * @returns {Input}
     */
    getField(name) {
        const field = get(this.fields, name);

        if (!field) {
            const error = `Error: Field "${name}" not defined for this editor`;

            cy.log(error);
            throw error;
        }

        return field;
    }

    /**
     * Types all the values into all the fields from the given key/value pairs
     * @param {object} values - The key/value pairs to enter into the editor
     */
    type(values) {
        cy.log('Common.Editor.type');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .type(values[field]);
            }
        );
    }

    /**
     * Assert all the values from all the fields from the given key/value pairs
     * @param {Object} values - The expected key/value pairs to check for
     */
    expect(values) {
        cy.log('Common.Editor.expect');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .expect(values[field]);
            }
        );
    }

    /**
     * Helper function to enter all values into the editor, save, then close
     * Waiting at the appropriate times for specific events to occur
     * @param {Object} values - The key/value pairs to enter into the editor
     * @param {boolean} openToggleBoxes - If true, opens all the toggle boxes
     */
    createAndClose(values, openToggleBoxes = true) {
        cy.log('Common.Editor.createAndClose');
        this.waitTillOpen();

        if (openToggleBoxes) {
            this.openAllToggleBoxes();
        }

        this.type(values);
        this.waitForAutosave();
        this.createButton.click();
        this.waitLoadingComplete();
        this.closeButton
            .should('exist')
            .should('not.be.disabled')
            .click();
        this.waitTillClosed();
    }

    /**
     * Assert the type of editor based on the icon in the header
     */
    expectItemType() {
        cy.log('Common.Editor.expectItemType');
        this.element.find(this.itemIcon)
            .should('exist');
    }

    /**
     * Waits until the editor is visible
     */
    waitTillOpen() {
        cy.log('Common.Editor.waitTillOpen');
        this.closeButton
            .should('exist')
            .should('be.enabled');
    }

    /**
     * Waits until the editor is no longer visible
     */
    waitTillClosed() {
        cy.log('Common.Editor.waitTillClosed');
        this.closeButton.should('not.exist');
    }

    /**
     * Wait for the autosave network request
     */
    waitForAutosave() {
        cy.log('Common.Editor.waitForAutosave');
        cy.intercept('PATCH', `**/api/${this.autosavePrefix}_autosave/*`).as('patchAutosave');
        cy.wait('@patchAutosave', {timeout: 3500});
    }

    waitForAutosavePost() {
        cy.log('Common.Editor.waitForAutosavePost');
        cy.intercept('POST', `**/api/${this.autosavePrefix}_autosave`).as('postAutosave');
        cy.wait('@postAutosave', {timeout: 3500});
    }

    /**
     * Wait for the loading of the editor to be complete
     */
    waitLoadingComplete() {
        cy.log('Common.Editor.waitLoadingComplete');
        this.element
            .find('.side-panel__content-tab-nav', {timeout: 30000})
            .should('exist');
    }

    /**
     * Finds all the toggle boxes that are currently minimised
     * and clicks on them, effectively opening them
     */
    openAllToggleBoxes() {
        cy.log('Common.Editor.openAllToggleBoxes');
        this.element
            .find('.toggle-box.toggle-box--circle.hidden')
            .click({multiple: true});
    }

    clickBookmark(bookmarkId: string) {
        cy.log('Common.Editor.scrollToBookmark');
        this.element
            .find(`[data-test-id="editor--bookmarks__${bookmarkId}"]`)
            .click();
    }

    getFormGroup(groupId: string) {
        cy.log('Common.Editor.getFormGroup');
        return this.element.find(`[data-test-id="editor--group__${groupId}"]`);
    }
}
