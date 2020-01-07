import BaseEditor from '../editors/baseEditor';
import Form from '../form';
import EmailInput from './emailInput';

export default class ContactsEditor extends BaseEditor {
    constructor() {
        super();
        this.fields = {
            honorific: new Form.Input(this, 'input[name="honorific"]'),
            first_name: new Form.Input(this, 'input[name="first_name"]'),
            last_name: new Form.Input(this, 'input[name="last_name"]'),
            organisation: new Form.Input(this, 'input[name="organisation"]'),
            job_title: new Form.Input(this, 'input[name="job_title"]'),
            contact_email: new EmailInput(this, 'email'),
        };
    }

    get element() {
        return cy.get('.contact-form');
    }

    get createButton() {
        return this.element.find('#save-edit-btn');
    }

    get closeButton() {
        return this.element.find('#cancel-edit-btn');
    }

    waitTillClosed() {
        cy.log('Contacts.Editor.waitTillClosed');
        this.element.should('not.exist');
    }
}
