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
        return get(this.fields, name);
    }

    type(values) {
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
        this.waitTillClose();
    }

    expect(values) {
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .expect(values[field]);
            }
        );
    }

    expectItemType() {
        this.element.find(this.itemIcon)
            .should('exist');
    }

    waitTillOpen() {
        this.closeButton.should('exist');
    }

    waitTillClose() {
        this.closeButton.should('not.exist');
    }

    waitForAutosave() {
        // Autosave fires every 3 seconds
        // This ensures we're half a second beyond that
        cy.wait(3500);
    }

    waitLoadingComplete() {
        this.element
            .find('.side-panel__content-tab-nav', {timeout: 30000})
            .should('exist');
    }

    openAllToggleBoxes() {
        this.element
            .find('.toggle-box.toggle-box--circle.hidden')
            .click({multiple: true});
    }
}
