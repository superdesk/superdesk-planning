import {Input} from './index';

export class RadioInputs extends Input {
    type(value) {
        cy.log('Common.RadioInputs.type');

        cy.get(this.selector + ' .sd-check__wrapper')
            .contains(value)
            .should('exist')
            .click();
    }

    expect(value) {
        cy.log('Common.RadioInputs.expect');
    }
}
