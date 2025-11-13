import {Input} from './input';
import {Popup} from '../ui';

/**
 * Wrapper class for a searchable user select input field
 * @extends Input
 */
export class CoverageUserSelectInput extends Input {
    type(value) {
        cy.log('Common.SearchableSelectInput.type');
        const popup = new Popup('[data-test-id="tree-select-popover"]');

        this.element.click();
        popup.waitTillOpen();

        popup.element.find('[data-test-id="filter-input"]', {timeout: 2000})
            .should('be.enabled')
            .type(value, {force: true});

        popup.element.find('li')
            .first()
            .click();

        popup.waitTillClosed();
    }

    expect(value) {
        cy.log('Common.SearchableSelectInput.expect');
        this.element.should('contain.text', value);
    }
}
