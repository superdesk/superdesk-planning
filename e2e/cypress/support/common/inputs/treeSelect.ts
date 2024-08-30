import {Input} from './input';

export class TreeSelect extends Input {
    allowMultiple: boolean;

    constructor(getParent, selector, allowMultiple: boolean) {
        super(getParent, selector);
        this.allowMultiple = allowMultiple;
    }

    get addButton() {
        return this.allowMultiple ?
            cy.get(this.selector + ' > .sd-input .tags-input__add-button') :
            cy.get(this.selector + ' button');
    }

    type(values: Array<string>) {
        cy.log('Common.TreeSelect.type');

        if (this.allowMultiple) {
            cy.wrap(values).each((value: string) => {
                this.addButton.click();
                cy.get('body').type(value);
                cy.get('[data-test-id="tree-select-popover"] ul li')
                    .eq(0)
                    .should('exist')
                    .click();
            });
        } else {
            const value = values[0];

            this.addButton.click();
            cy.get('body').type(value);
            cy.get('[data-test-id="tree-select-popover"] ul li')
                .eq(0)
                .should('exist')
                .click();
        }
    }

    expect(values) {
        cy.log('Common.TreeSelect.expect');
        cy.wrap(values).each((value) => {
            this.element.should('contain.text', value);
        });
    }

    expectValidData(valid: boolean = true) {
        cy.get(this.selector + ' .sd-input--invalid')
            .should(valid ? 'not.exist' : 'exist');
    }

    clear() {
        cy.log('Common.TreeSelect.clear');
        cy.get(this.selector + ' [data-test-id="item"] [data-test-id="remove"]')
            .click({multiple: true});
    }
}
