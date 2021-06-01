import {Input} from './input';

export class LocationInput extends Input {
    get inputElement() {
        return cy.get(this.selector + '  .sd-line-input__input');
    }

    get listItem() {
        return cy.get(this.selector + ' .sd-list-item');
    }

    get popup() {
        return cy.get('.addgeolookup__popup');
    }

    get addNewButton() {
        return cy.get('[data-test-id="location-search__create-new"]')
            .should('exist')
            .should('be.enabled');
    }

    search(value: string) {
        cy.log('Common.LocationInput.search');
        this.inputElement.type(value);
        this.popup.should('exist');
    }

    type(value: string) {
        cy.log('Common.LocationInput.type');
        this.inputElement.type(value);
        this.popup
            .should('exist')
            .find('.addgeolookup__item')
            .contains(value);

        cy.get('body').type('{downarrow}{enter}');
    }

    expect(value) {
        cy.log('Common.LocationInput.expect');
        this.listItem
            .should('exist')
            .contains(value);
    }

    clear() {
        cy.log('Common.LocationInput.clear');
        this.listItem
            .should('exist')
            .find('.icon-trash')
            .click({force: true});
    }
}
