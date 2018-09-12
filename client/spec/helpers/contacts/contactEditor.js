import {Input} from '../form';

export class ContactEditor {
    constructor(parent) {
        this.form = parent.element(by.className('contact-form'));
        this.saveButton = parent.element(by.id('save-edit-btn'));
        this.cancelButton = parent.element(by.id('cancel-edit-btn'));
    }

    getFormInput(name, type = 'input') {
        return new Input(this.form, name, type, false);
    }

    addEmail(email, index = 0) {
        this.form.element(by.className('icon-plus-large')).click();
        this.getFormInput(`contact_email[${index}]`).setValue(email);
    }
}
