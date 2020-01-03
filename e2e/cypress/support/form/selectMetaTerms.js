import Input from './input';

export default class SelectMetaTerms extends Input {
    get addButton() {
        return cy.get(this.selector + ' > .sd-line-input > .dropdown__toggle');
    }

    expect(values) {
        cy.wrap(values).each((value) => {
            this.element.should('contain.text', value);
        });
    }

    type(values) {
        cy.wrap(values).each((value) => {
            this.addButton.click();
            cy.get('body')
                .type(value + '{downarrow}{enter}');
        });
    }
}
