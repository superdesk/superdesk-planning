import {get} from 'lodash';

import {UI} from '../';


export default class BaseEditor {
    constructor(itemIcon) {
        this.itemIcon = itemIcon;
        this.fields = {};
    }

    // Getters
    get element() {
        return cy.get('.sd-edit-panel');
    }

    get createButton() {
        return this.element.find('#create');
    }

    get closeButton() {
        return this.element.find('#close');
    }

    get minimiseButton() {
        return this.element.find('button[title="Minimise"]');
    }

    get actionMenu() {
        return new UI.ActionMenu(() => this.element);
    }

    getField(name) {
        const field = get(this.fields, name);

        if (!field) {
            const error = `Error: Field "${name}" not defined for this editor`;

            cy.log(error);
            throw error;
        }

        return field;
    }

    type(values) {
        cy.log('Editor.type');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .type(values[field]);
            }
        );
    }

    createAndClose(values, openToggleBoxes = true) {
        this.waitTillOpen();

        if (openToggleBoxes) {
            this.openAllToggleBoxes();
        }

        this.type(values);
        this.waitForAutosave();
        this.createButton.click();
        this.waitLoadingComplete();
        this.closeButton.click();
        this.waitTillClosed();
    }

    expect(values) {
        cy.log('Editor.expect');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .expect(values[field]);
            }
        );
    }

    expectItemType() {
        cy.log('Editor.expectItemType');
        this.element.find(this.itemIcon)
            .should('exist');
    }

    waitTillOpen() {
        cy.log('Editor.waitTillOpen');
        this.closeButton.should('exist');
    }

    waitTillClosed() {
        cy.log('Editor.waitTillClosed');
        this.closeButton.should('not.exist');
    }

    waitForAutosave() {
        cy.log('Editor.waitForAutosave');
        // Autosave fires every 3 seconds
        // This ensures we're half a second beyond that
        cy.wait(3500);
    }

    waitLoadingComplete() {
        cy.log('Editor.waitLoadingComplete');
        this.element
            .find('.side-panel__content-tab-nav', {timeout: 30000})
            .should('exist');
    }

    openAllToggleBoxes() {
        cy.log('Editor.openAllToggleBoxes');
        this.element
            .find('.toggle-box.toggle-box--circle.hidden')
            .click({multiple: true});
    }
}
