import {Input} from './input';

/**
 * Wrapper class for a searchable user select input field
 * @extends Input
 */
export class UserSelectInput extends Input {
    type(value) {
        cy.log('Common.SearchableSelectInput.type');

        // Click on the element to open the dropdown
        this.element.click();

        // Type into the input inside the dropdown panel
        cy.get('.p-dropdown-panel input').type(value, {force: true});

        // Click on the first list item in the dropdown
        cy.get('.p-dropdown-panel li').first().click();
    }

    expect(value) {
        cy.log('Common.SearchableSelectInput.expect');

        // Ensure that the dropdown panel contains the expected text
        cy.get('.p-dropdown-panel').should('contain.text', value);
    }
}
