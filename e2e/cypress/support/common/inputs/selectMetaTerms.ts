import {Input} from './input';

/**
 * Wrapper class for Superdesk's SelectMetaTerms input field
 * @extends Input
 */
export class SelectMetaTerms extends Input {
    /**
     * Returns the dom node for the add button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get addButton() {
        return cy.get(this.selector + ' > .sd-line-input > .dropdown__toggle');
    }

    /**
     * Clear the input then type the value into the input field
     * @param {Array<string>} values - The values to type into the input field
     */
    type(values) {
        cy.log('Common.SelectMetaTerms.type');
        cy.wrap(values).each((value) => {
            this.addButton.click();
            cy.get('body')
                .type(value + '{downarrow}{enter}');
        });
    }

    /**
     * Assert the value of this input
     * @param {Array<string>} values - The values to expect
     */
    expect(values) {
        cy.log('Common.SelectMetaTerms.expect');
        cy.wrap(values).each((value) => {
            this.element.should('contain.text', value);
        });
    }

    clear() {
        cy.log('Common.SelectMetaTerms.clear: Currently does not work');
        cy.get(this.selector + ' .sd-line-input__input li')
            .then(($list) => {
                const values = Cypress.$.map($list, (element) => element.innerText);

                cy.wrap(values)
                    .each((value) => {
                        cy.get(this.selector + ' .sd-line-input__input li')
                            .contains(value)
                            .should('exist')
                            .click();
                    });
            });
    }
}
