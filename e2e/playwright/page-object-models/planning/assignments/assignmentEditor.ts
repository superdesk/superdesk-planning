import {Page, Locator} from '@playwright/test';
import {get} from 'lodash';

import {Modal, Input, CoverageUserSelectInput, SelectInput} from '../../../utils/common';

/**
 * Wrapper class for Superdesk's Assignment popup editor
 * @extends Modal
 */
export class AssignmentEditor extends Modal {
    fields: {[key: string]: Input};
    constructor(page: Page) {
        super(page);
        const getParent = () => this.element;

        this.fields = {
            desk: new SelectInput(page, getParent, 'select[name="assigned_to.desk"]'),
            coverage_provider: new SelectInput(page, getParent, 'select[name="assigned_to.coverage_provider"]'),
            user: new CoverageUserSelectInput(page, getParent, '[data-test-id="assigned_to.user"]'),
        };
    }

    /**
     * Returns the dom node for the editor component
     * @returns {Locator}
     */
    get form(): Locator {
        return this.element.getByTestId('form-update-assignment');
    }

    /**
     * Returns the dom node for the cancel button
     * @returns {Locator}
     */
    get cancelButton(): Locator {
        return this.getFooterButton('Cancel');
    }

    /**
     * Returns the dom node for the OK button
     * @returns {Locator}
     */
    get okButton(): Locator {
        return this.getFooterButton('OK');
    }

    /**
     * Returns the Input instance for the field based on the configured fields variable
     * @param {string} name - The name of the field to get the Input instance from
     * @returns {Input}
     */
    getField(name: string): Input {
        return get(this.fields, name);
    }

    /**
     * Types all the values into all the fields from the given key/value pairs
     * @param {object} values - The key/value pairs to enter into the editor
     */
    async type(values: any): Promise<void> {
        for (const field in values) {
            if (Object.hasOwnProperty.call(values, field)) {
                await this.getField(field).type(values[field]);
            }
        }
    }

    /**
     * Assert all the values from all the fields from the given key/value pairs
     * @param {Object} values - The expected key/value pairs to check for
     */
    async expect(values: any): Promise<void> {
        for (const field in values) {
            if (Object.hasOwnProperty.call(values, field)) {
                await this.getField(field).expect(values[field]);
            }
        }
    }
}
