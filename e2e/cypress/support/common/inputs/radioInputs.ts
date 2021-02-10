import {Input} from './index';

export class RadioInputs extends Input {
    buttonSelector: string;

    constructor(getParent, selector: string, buttonSelector: string = '.sd-check__wrapper') {
        super(getParent, selector);

        this.buttonSelector = buttonSelector;
    }

    type(value: Array<string> | string) {
        cy.log('Common.RadioInputs.type');

        const enterValue = (singleValue: string) => {
            cy.get(this.selector + ' ' + this.buttonSelector)
                .contains(singleValue)
                .should('exist')
                .click();
        };

        if (Array.isArray(value)) {
            cy.wrap(value).each(enterValue);
        } else {
            enterValue(value);
        }
    }

    expect(value) {
        cy.log('Common.RadioInputs.expect');
    }
}
