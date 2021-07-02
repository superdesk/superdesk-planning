import {Input} from '../../common/inputs';

/**
 * Wrapper class for Superdesk Event's website link input
 * @extends Input
 */
export class LinkInput extends Input {
    /**
     * Returns the dom node for the ADD button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get addButton() {
        return this.parent.find('[data-test-id="event-links__add-new-button"]');
    }

    /**
     * Returns the dom nodes for all the links added to the component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get inputs() {
        return this.parent.find('.link-input__input');
    }

    /**
     * Adds all the links to the component at the specified starting index
     * @param {Array<string>} values - The list of links to add
     * @param {number} startingIndex - The index to start adding links to
     */
    type(values, startingIndex = 0) {
        cy.log('Planning.Events.LinkInput.type');
        cy.wrap(values).each((value, index) => {
            this.addButton.click({force: true});
            const input = new Input(
                this.getParent,
                `textarea[name="links[${startingIndex + index}]"]`
            );

            input.type(value);
        });
    }

    /**
     * Assert all the link values have been added to the component
     * @param {Array<string>} values - The expected list of links to have been added
     */
    expect(values) {
        cy.log('Planning.Events.LinkInput.expect');
        cy.wrap(values).each((value) => {
            this.inputs.should('contain.text', value);
        });
    }
}
