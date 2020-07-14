import {get} from 'lodash';

import {Modal} from '../../common/ui';
import {SelectInput, UserSelectInput} from '../../common/inputs';

/**
 * Wrapper class for Superdesk's Assignment popup editor
 * @extends Modal
 */
export class AssignmentEditor extends Modal {
    constructor() {
        super();

        this.fields = {
            desk: new SelectInput(() => this.element, 'select[name="assigned_to.desk"]'),
            coverage_provider: new SelectInput(() => this.element, 'select[name="assigned_to.coverage_provider"]'),
            user: new UserSelectInput(() => this.element, '[data-test-id="assigned_to.user"]'),
        };
    }

    /**
     * Returns the dom node for the editor component
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get form() {
        return this.element.find('.update-assignment');
    }

    /**
     * Returns the dom node for the cancel button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get cancelButton() {
        return this.getFooterButton('Cancel');
    }

    /**
     * Returns the dom node for the OK button
     * @returns {Cypress.Chainable<JQuery<HTMLElement>>}
     */
    get okButton() {
        return this.getFooterButton('OK');
    }

    /**
     * Returns the Input instance for the field based on the configured fields variable
     * @param {string} name - The name of the field to get the Input instance from
     * @returns {Input}
     */
    getField(name) {
        return get(this.fields, name);
    }

    /**
     * Types all the values into all the fields from the given key/value pairs
     * @param {object} values - The key/value pairs to enter into the editor
     */
    type(values) {
        cy.log('Planning.Assignments.Editor.type');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .type(values[field]);
            }
        );
    }

    /**
     * Assert all the values from all the fields from the given key/value pairs
     * @param {Object} values - The expected key/value pairs to check for
     */
    expect(values) {
        cy.log('Planning.Assignments.Editor.expect');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .expect(values[field]);
            }
        );
    }
}
