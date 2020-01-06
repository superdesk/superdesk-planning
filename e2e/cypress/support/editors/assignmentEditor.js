import {get} from 'lodash';

import Modal from '../ui/modal';
import Form from '../form';

export default class AssignmentEditor extends Modal {
    constructor() {
        super();

        this.fields = {
            desk: new Form.SelectInput(this, 'select[name="assigned_to.desk"]'),
            coverage_provider: new Form.SelectInput(this, 'select[name="assigned_to.coverage_provider"]'),
            // user: new Form.UserInput(this
            // priority: new Form.UrgencyInput(this
        };
    }

    get form() {
        return this.element.find('.update-assignment');
    }

    get cancelButton() {
        return this.getFooterButton('Cancel');
    }

    get okButton() {
        return this.getFooterButton('OK');
    }

    getField(name) {
        return get(this.fields, name);
    }

    type(values) {
        cy.log('Editor.Assignment.type');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .type(values[field]);
            }
        );
    }

    expect(values) {
        cy.log('Editor.Assignment.expect');
        cy.wrap(Object.keys(values)).each(
            (field) => {
                this.getField(field)
                    .expect(values[field]);
            }
        );
    }
}
